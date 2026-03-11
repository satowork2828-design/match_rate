export interface AgendaItem {
  id: string;
  agendaName: string;
  scriptName: string;
  mainTalk?: string;
  subTalk?: string;
}

export interface AgendaRegistrationPayload {
  agendaName: string;
  scriptName: string;
  mainTalk: string;
  subTalk: string;
}
