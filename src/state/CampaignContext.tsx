import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { CampaignAction, campaignReducer, createInitialAppState } from "./campaignReducer";
import { loadPersistedState, savePersistedState } from "./storage";
import { AppState, Campaign } from "./types";

interface CampaignContextValue {
  state: AppState;
  activeCampaign: Campaign;
  dispatch: React.Dispatch<CampaignAction>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

function init(): AppState {
  const persisted = loadPersistedState();
  if (persisted) {
    return {
      ...createInitialAppState(),
      campaigns: persisted.campaigns,
      activeId: persisted.activeId ?? persisted.campaigns[0].id,
    };
  }
  return createInitialAppState();
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, undefined, init);

  useEffect(() => {
    savePersistedState({ campaigns: state.campaigns, activeId: state.activeId });
  }, [state.campaigns, state.activeId]);

  const activeCampaign = useMemo(
    () => state.campaigns.find((c) => c.id === state.activeId) ?? state.campaigns[0],
    [state.campaigns, state.activeId]
  );

  const value = useMemo(
    () => ({ state, activeCampaign, dispatch }),
    [state, activeCampaign]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error("useCampaign must be used within a CampaignProvider");
  return ctx;
}
