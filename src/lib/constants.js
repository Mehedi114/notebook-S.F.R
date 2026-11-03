export const SFR_CHANNEL_URL =
  'https://youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg';

export const SFR_CHANNEL_LINKS = [
  {
    id: 'channel',
    label: 'YouTube চ্যানেল',
    url: 'https://youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg',
    primary: true,
  },
  {
    id: 'videos',
    label: 'Videos',
    url: 'https://www.youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg/videos',
  },
  {
    id: 'shorts',
    label: 'Shorts',
    url: 'https://www.youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg/shorts',
  },
  {
    id: 'subscribe',
    label: 'Subscribe',
    url: 'https://www.youtube.com/channel/UCj-7BQtODymbgBDWNwxjSZg?sub_confirmation=1',
  },
];

export const SCRIPT_STATUSES = [
  {
    id: 'ready_for_shoot',
    label: 'শুটের জন্য রেডি',
    shortLabel: 'শুট রেডি',
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  },
  {
    id: 'draft',
    label: 'চলমান লেখা (ড্রাফট)',
    shortLabel: 'ড্রাফট',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  },
  {
    id: 'in_editing',
    label: 'এডিটিং চলছে',
    shortLabel: 'এডিটিং',
    dot: 'bg-indigo-500',
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
  },
  {
    id: 'published',
    label: 'YouTube-এ আপলোডেড',
    shortLabel: 'আপলোডেড',
    dot: 'bg-red-500',
    badge:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  },
];

export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube Video', aspect: '16:9', color: 'text-red-500' },
  { id: 'shorts', label: 'YouTube Shorts', aspect: '9:16', color: 'text-orange-500' },
];

export const TEAM_ROLES = [
  'Creator / Writer',
  'Actor / Cast',
  'Cameraman',
  'Video Editor',
  'Team Member',
];
