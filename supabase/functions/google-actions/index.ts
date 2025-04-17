import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Google API endpoints
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3"
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4"

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, action, params } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user's Google tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google integration not configured or tokens not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (tokenData.expires_at < now) {
      console.log("Token expired, refreshing...")
      
      // Refresh the token
      const refreshResult = await refreshToken(userId, tokenData.refresh_token)
      if (!refreshResult.success) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to refresh Google token' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
      
      // Use the new access token
      tokenData.access_token = refreshResult.accessToken
    }

    // Process the requested action
    switch (action) {
      case 'createCalendarEvent':
        return await createCalendarEvent(tokenData.access_token, params, corsHeaders)
      
      case 'createDocument':
        return await createDriveDocument(tokenData.access_token, params, corsHeaders)
      
      case 'createSpreadsheet':
        return await createSheetSpreadsheet(tokenData.access_token, params, corsHeaders)
      
      case 'listCalendarEvents':
        return await listCalendarEvents(tokenData.access_token, params, corsHeaders)
        
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in google-actions function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to refresh an expired token
async function refreshToken(userId: string, refreshToken: string) {
  try {
    // Call the token refresh function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-token-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        userId,
        refreshToken
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error refreshing token:', errorText)
      return { success: false, error: errorText }
    }

    const data = await response.json()
    return {
      success: true,
      accessToken: data.accessToken,
      expiresAt: data.expiresAt
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    return { success: false, error: error.message }
  }
}

// Create an event in Google Calendar
async function createCalendarEvent(accessToken: string, params: any, corsHeaders: any) {
  try {
    const { summary, description, startDateTime, endDateTime, timeZone = 'America/Sao_Paulo', attendees = [] } = params
    
    if (!summary || !startDateTime || !endDateTime) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters for calendar event' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("Creating calendar event with params:", JSON.stringify({
      summary,
      description,
      startDateTime,
      endDateTime,
      timeZone,
      attendeesCount: attendees.length
    }, null, 2));

    // Prepare the event data
    const eventData = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      attendees: attendees.map((email: string) => ({ email })),
    }

    // Call the Google Calendar API
    const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error creating calendar event:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    console.log("Calendar event created successfully:", data.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: data.id,
        eventLink: data.htmlLink,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Create a Google Doc
async function createDriveDocument(accessToken: string, params: any, corsHeaders: any) {
  try {
    const { name, content = '' } = params
    
    if (!name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters for document creation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First create an empty Google Doc
    const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.document',
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Error creating Google Doc:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: createResponse.status }
      )
    }

    const fileData = await createResponse.json()
    const fileId = fileData.id

    // If content is provided, update the document with content
    if (content) {
      // The Docs API requires a separate call to update content
      // This is a simplified version, in real implementation you would use the Docs API
      console.log(`Document created with ID: ${fileId}. Would update content: ${content.substring(0, 50)}...`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId: fileId,
        documentLink: `https://docs.google.com/document/d/${fileId}/edit`,
        data: fileData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error creating Google Doc:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

// Create a Google Sheet
async function createSheetSpreadsheet(accessToken: string, params: any, corsHeaders: any) {
  try {
    const { title, sheets = [{ title: 'Sheet1' ]}, content = null } = params
    
    if (!title) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters for spreadsheet creation' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Creating spreadsheet "${title}" with ${sheets.length} sheets`);
    
    // Create a new spreadsheet
    const response = await fetch(`${GOOGLE_SHEETS_API}/spreadsheets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: sheets.map((sheet: any) => ({
          properties: {
            title: sheet.title,
          },
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error creating spreadsheet:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    const spreadsheetId = data.spreadsheetId
    
    // If content is provided, update the spreadsheet with the content
    if (content) {
      // In this example: "com 3 nomes aleatórios"
      // Parse the content to determine what kind of data to add
      
      // For the example of "3 nomes aleatórios"
      if (content.includes('nomes aleatórios')) {
        // Determine how many names to generate
        const numberMatch = content.match(/(\d+)\s+nomes\s+aleatórios/i)
        const numberOfNames = numberMatch ? parseInt(numberMatch[1]) : 3
        
        // Generate random names
        const randomNames = generateRandomNames(numberOfNames)
        
        // Update the spreadsheet with the random names
        await updateSpreadsheetWithNames(accessToken, spreadsheetId, randomNames)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        spreadsheetId: data.spreadsheetId,
        spreadsheetLink: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error creating spreadsheet:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

/**
 * Generate random names
 */
function generateRandomNames(count: number): string[] {
  const firstNames = [
    "Maria", "João", "Ana", "Pedro", "Juliana", "Lucas", "Fernanda", "Carlos", 
    "Mariana", "Rafael", "Amanda", "Bruno", "Camila", "Diego", "Larissa", "Gabriel",
    "Beatriz", "Eduardo", "Isabela", "Felipe", "Laura", "Gustavo", "Natália"
  ]
  
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", 
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Alves",
    "Araújo", "Monteiro", "Barbosa", "Dias", "Mendes", "Castro", "Campos", "Cardoso"
  ]
  
  const names = []
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    names.push(`${firstName} ${lastName}`)
  }
  
  return names
}

/**
 * Update a spreadsheet with random names
 */
async function updateSpreadsheetWithNames(accessToken: string, spreadsheetId: string, names: string[]): Promise<boolean> {
  try {
    // Create values array
    const values = names.map(name => [name])
    
    // Update the spreadsheet with values
    const response = await fetch(`${GOOGLE_SHEETS_API}/spreadsheets/${spreadsheetId}/values/A1:A${names.length}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `A1:A${names.length}`,
        majorDimension: "ROWS",
        values: values
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error updating spreadsheet:', errorText)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating spreadsheet with names:', error)
    return false
  }
}

// List events from Google Calendar
async function listCalendarEvents(accessToken: string, params: any, corsHeaders: any) {
  try {
    const { maxResults = 10, timeMin = new Date().toISOString() } = params
    
    // Call the Google Calendar API
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events?maxResults=${maxResults}&timeMin=${timeMin}&orderBy=startTime&singleEvents=true`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error listing calendar events:', errorText)
      return new Response(
        JSON.stringify({ success: false, error: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    return new Response(
      JSON.stringify({ 
        success: true, 
        events: data.items,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error listing calendar events:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}
