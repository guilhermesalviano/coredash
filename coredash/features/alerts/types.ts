export interface ScheduledAlert {
  id: string;
  title: string;
  hour: number;
  minute: number;
  sound?: string;
  soundApi?: string;
  volume?: number;
  repeat?: number;
}

export interface AlertNotification extends ScheduledAlert {
  soundBlocked: boolean;
}
