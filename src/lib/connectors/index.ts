import { CONNECTORS, type ConnectorDefinition } from "./registry";

export type ConnectorStatus = {
  id: string;
  name: string;
  category: ConnectorDefinition["category"];
  enabled: boolean;
  status: "available" | "disabled";
};

export function getConnectorStatuses(): ConnectorStatus[] {
  return CONNECTORS.map((connector) => ({
    id: connector.id,
    name: connector.name,
    category: connector.category,
    enabled: connector.enabled,
    status: connector.enabled ? "available" : "disabled",
  }));
}

export function getEnabledConnectors(): ConnectorDefinition[] {
  return CONNECTORS.filter((connector) => connector.enabled);
}
