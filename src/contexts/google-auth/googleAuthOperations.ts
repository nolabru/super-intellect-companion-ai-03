
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { GoogleTokens, GoogleConnectionState } from "./types";
import { toast } from "sonner";

/**
 * Atualiza tokens do Google quando expirados
 */
export const refreshGoogleTokens = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setConnectionState?: (state: GoogleConnectionState) => void
): Promise<boolean> => {
  if (!user || !googleTokens || !googleTokens.refreshToken) {
    console.error("[googleAuthOperations] Cannot refresh Google tokens: missing user or refresh token");
    setConnectionState?.(GoogleConnectionState.ERROR);
    return false;
  }

  try {
    console.log("[googleAuthOperations] Refreshing Google tokens...");
    setConnectionState?.(GoogleConnectionState.CONNECTING);
    
    const { data, error } = await supabase.functions.invoke("google-token-refresh", {
      body: {
        userId: user.id,
        refreshToken: googleTokens.refreshToken,
      },
    });

    if (error || !data.success) {
      console.error("[googleAuthOperations] Error refreshing Google tokens:", error || data.error);
      setConnectionState?.(GoogleConnectionState.ERROR);
      return false;
    }

    // Atualizar tokens localmente
    setGoogleTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || googleTokens.refreshToken, // Manter o refresh token anterior se não retornar um novo
      expiresAt: data.expiresAt,
    });

    setConnectionState?.(GoogleConnectionState.CONNECTED);
    console.log("[googleAuthOperations] Google tokens refreshed successfully");
    return true;
  } catch (error) {
    console.error("[googleAuthOperations] Error during Google token refresh:", error);
    setConnectionState?.(GoogleConnectionState.ERROR);
    return false;
  }
};

/**
 * Verifica permissões do Google e atualiza tokens se necessário
 */
export const checkGooglePermissions = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  refreshTokens: () => Promise<boolean>,
  setConnectionState?: (state: GoogleConnectionState) => void
): Promise<boolean> => {
  if (!user || !googleTokens) {
    console.error("[googleAuthOperations] Cannot check Google permissions: user not logged in or no Google tokens");
    setConnectionState?.(GoogleConnectionState.DISCONNECTED);
    return false;
  }

  // Verificar se o token está expirado
  const now = Math.floor(Date.now() / 1000);
  if (googleTokens.expiresAt <= now) {
    console.log("[googleAuthOperations] Google token expired, attempting to refresh");
    setConnectionState?.(GoogleConnectionState.CONNECTING);
    const refreshed = await refreshTokens();
    if (!refreshed) {
      toast.error("Falha ao atualizar permissões Google", {
        description: "Por favor, faça login novamente com sua conta Google.",
      });
      setConnectionState?.(GoogleConnectionState.ERROR);
      return false;
    }
  }

  try {
    console.log("[googleAuthOperations] Checking Google permissions...");
    setConnectionState?.(GoogleConnectionState.CONNECTING);
    
    const { data, error } = await supabase.functions.invoke("google-verify-permissions", {
      body: {
        userId: user.id,
      },
    });

    if (error || !data.success) {
      console.error("[googleAuthOperations] Error verifying Google permissions:", error || data.error);
      setConnectionState?.(GoogleConnectionState.ERROR);
      return false;
    }

    setConnectionState?.(GoogleConnectionState.CONNECTED);
    return true;
  } catch (error) {
    console.error("[googleAuthOperations] Error during Google permissions check:", error);
    setConnectionState?.(GoogleConnectionState.ERROR);
    return false;
  }
};

/**
 * Desconecta a conta Google do usuário
 */
export const disconnectGoogle = async (
  user: User | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setIsGoogleConnected: (connected: boolean) => void,
  setConnectionState?: (state: GoogleConnectionState) => void
): Promise<void> => {
  if (!user) {
    console.error("[googleAuthOperations] Cannot disconnect Google: user not logged in");
    return;
  }

  try {
    console.log("[googleAuthOperations] Disconnecting Google account...");
    setConnectionState?.(GoogleConnectionState.CONNECTING);
    
    const { error } = await supabase
      .from("user_google_tokens")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("[googleAuthOperations] Error disconnecting Google account:", error);
      toast.error("Erro ao desconectar conta Google", {
        description: "Tente novamente mais tarde.",
      });
      setConnectionState?.(GoogleConnectionState.ERROR);
      return;
    }

    // Limpar tokens locais
    setGoogleTokens(null);
    setIsGoogleConnected(false);
    setConnectionState?.(GoogleConnectionState.DISCONNECTED);

    toast.success("Conta Google desconectada", {
      description: "Sua conta Google foi desconectada com sucesso.",
    });
  } catch (error) {
    console.error("[googleAuthOperations] Error during Google disconnection:", error);
    toast.error("Erro ao desconectar conta Google", {
      description: "Tente novamente mais tarde.",
    });
    setConnectionState?.(GoogleConnectionState.ERROR);
  }
};
