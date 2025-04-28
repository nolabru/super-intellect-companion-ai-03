
# Component Documentation

This document provides documentation for major components in the project.

## Table of Contents

1. [Message Input Components](#message-input-components)
2. [Parameter Management Components](#parameter-management-components)
3. [Mode Selection Components](#mode-selection-components)
4. [Chat Layout Components](#chat-layout-components)
5. [Utility Hooks](#utility-hooks)

## Message Input Components

### MessageInput

The `MessageInput` component handles user text input and commands.

**Location**: `src/components/chat/MessageInput.tsx`

**Features**:
- Auto-resizing textarea
- Google command integration with @ triggers
- Mobile-optimized interface
- Support for image/video/audio generation modes

**Props**:
- `message`: Current message text
- `setMessage`: Function to update message text
- `onSendMessage`: Function called when send button is clicked
- `onAttachment`: Function to handle file attachments
- `isImageGenerationModel`: Whether the current model can generate images
- `isSending`: Whether a message is currently being sent
- `mode`: Current chat mode (text, image, video, audio, call)
- `model`: Current AI model being used

## Parameter Management Components

### ParametersManager

A responsive component for managing parameters specific to each generation mode.

**Location**: `src/components/chat/parameters/ParametersManager.tsx`

**Features**:
- Responsive design with sheet on mobile and popover on desktop
- Mode-specific parameter options
- Consistent interface across device types

**Props**:
- `mode`: Current chat mode
- `model`: Current AI model
- `onParamsChange`: Function to handle parameter changes
- `initialParams`: Optional initial parameters
- `variant`: UI variant ('button' or 'icon')
- `className`: Additional CSS classes

### Mode-Specific Parameter Components

- **ImageParameters**: For image generation settings
- **VideoParameters**: For video generation settings
- **AudioParameters**: For audio generation settings

## Mode Selection Components

### RefinedModeSelector

An enhanced mode selector with touch-friendly interactions.

**Location**: `src/components/chat/RefinedModeSelector.tsx`

**Features**:
- Touch ripple effect on mobile
- Visual feedback for active state
- Optimized touch targets for mobile users

**Props**:
- `activeMode`: Current active mode
- `onChange`: Function to handle mode changes
- `className`: Additional CSS classes

## Chat Layout Components

### Index (Main Chat Layout)

The main layout component for the chat interface.

**Location**: `src/pages/Index.tsx`

**Features**:
- Responsive sidebar with overlay on mobile
- Model comparison support
- Dynamic mode switching
- Mobile-optimized controls

## Utility Hooks

### useTouchDevice

Hook to detect touch-capable devices.

**Location**: `src/hooks/useTouchDevice.ts`

**Usage**:
```jsx
const isTouchDevice = useTouchDevice();
if (isTouchDevice) {
  // Apply touch-specific logic
}
```

### useIsMobile

Hook to detect mobile viewports based on breakpoints.

**Location**: `src/hooks/use-mobile.tsx`

**Usage**:
```jsx
const isMobile = useIsMobile('md'); // Using 'md' breakpoint (768px)
```

### useFileUpload

Hook for managing file uploads with validation and preview functionality.

**Location**: `src/hooks/useFileUpload.ts`

**Usage**:
```jsx
const {
  files,
  filePreviewUrls,
  isUploading,
  fileInputRef,
  handleFileChange,
  removeFile,
  uploadFiles
} = useFileUpload({ mode: 'image', maxFileSizeMB: 5 });
```

### useGenerationParams

Hook for managing generation parameters with type safety and mode awareness.

**Location**: `src/hooks/useGenerationParams.ts`

**Usage**:
```jsx
const { 
  params, 
  updateParams, 
  resetParams 
} = useGenerationParams({ 
  mode: 'image', 
  model: 'sdxl' 
});
```
