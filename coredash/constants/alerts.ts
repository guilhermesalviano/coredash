import type { ScheduledAlert } from "@/features/alerts/types";

export const ALERTS: readonly ScheduledAlert[] = [
  {
    id: "dogs-morning",
    title: "Dogs - Time to eat",
    hour: 10,
    minute: 0,
    soundApi: "/api/audios/feed-dogs",
    sound: "/audios/feed-dogs/take-off-cartoon.mp3"
  },
  {
    id: "dogs-evening",
    title: "Dogs - Time to eat 2",
    hour: 20,
    minute: 0,
    soundApi: "/api/audios/feed-dogs",
    sound: "/audios/feed-dogs/take-off-cartoon.mp3"
  }
]
