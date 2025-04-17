
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { GoogleTokens } from "./types";
import { toast } from "sonner";

/**
 * Atualiza tokens do Google quando expirados
 */
export const refreshGoogleTokens = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void
): Promise<boolean> => {
  if (!user || !googleTokens || !googleTokens.refreshToken) {
    console.error("Cannot refresh Google tokens: missing user or refresh token");
    return false;
  }

  try {
    console.log("Refreshing Google tokens...");
    const { data, error } = await supabase.functions.invoke("google-token-refresh", {
      body: {
        userId: user.id,
        refreshToken: googleTokens.refreshToken,
      },
    });

    if (error || !data.success) {
      console.error("Error refreshing Google tokens:", error || data.error);
      return false;
    }

    // Atualizar tokens localmente
    setGoogleTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || googleTokens.refreshToken, // Manter o refresh token anterior se não retornar um novo
      expiresAt: data.expiresAt,
    });

    console.log("Google tokens refreshed successfully");
    return true;
  } catch (error) {
    console.error("Error during Google token refresh:", error);
    return false;
  }
};

/**
 * Verifica permissões do Google e atualiza tokens se necessário
 */
export const checkGooglePermissions = async (
  user: User | null,
  googleTokens: GoogleTokens | null,
  refreshTokens: () => Promise<boolean>
): Promise<boolean> => {
  if (!user || !googleTokens) {
    console.error("Cannot check Google permissions: user not logged in or no Google tokens");
    return false;
  }

  // Verificar se o token está expirado
  const now = Math.floor(Date.now() / 1000);
  if (googleTokens.expiresAt <= now) {
    console.log("Google token expired, attempting to refresh");
    const refreshed = await refreshTokens();
    if (!refreshed) {
      toast.error("Falha ao atualizar permissões Google", {
        description: "Por favor, faça login novamente com sua conta Google.",
      });
      return false;
    }
  }

  try {
    console.log("Checking Google permissions...");
    const { data, error } = await supabase.functions.invoke("google-verify-permissions", {
      body: {
        userId: user.id,
      },
    });

    if (error || !data.success) {
      console.error("Error verifying Google permissions:", error || data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error during Google permissions check:", error);
    return false;
  }
};

/**
 * Desconecta a conta Google do usuário
 */
export const disconnectGoogle = async (
  user: User | null,
  setGoogleTokens: (tokens: GoogleTokens | null) => void,
  setIsGoogleConnected: (connected: boolean) => void
): Promise<void> => {
  if (!user) {
    console.error("Cannot disconnect Google: user not logged in");
    return;
  }

  try {
    console.log("Disconnecting Google account...");
    const { error } = await supabase
      .from("user_google_tokens")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error disconnecting Google account:", error);
      toast.error("Erro ao desconectar conta Google", {
        description: "Tente novamente mais tarde.",
      });
      return;
    }

    // Limpar tokens locais
    setGoogleTokens(null);
    setIsGoogleConnected(false);

    toast.success("Conta Google desconectada", {
      description: "Sua conta Google foi desconectada com sucesso.",
    });
  } catch (error) {
    console.error("Error during Google disconnection:", error);
    toast.error("Erro ao desconectar conta Google", {
      description: "Tente novamente mais tarde.",
    });
  }
};
