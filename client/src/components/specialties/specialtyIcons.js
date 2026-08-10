import {
  Activity,
  Baby,
  Bone,
  Brain,
  Droplet,
  Ear,
  Eye,
  HeartPulse,
  Wind,
  Ribbon,
  Scale,
  Smile,
  Sparkles,
  Stethoscope,
  Thermometer,
  UserRound,
  Users,
} from 'lucide-react'

/**
 * Maps a specialty slug (or its stored `icon` key) to a Lucide component.
 * Central mapping keeps the UI icon-consistent and avoids emoji in the main UI.
 */
const ICON_MAP = {
  'general-health': Stethoscope,
  'child-care': Baby,
  'skin-and-hair-health': Sparkles,
  'sexual-health': Ribbon,
  'digestive-and-liver-health': Activity,
  'womens-health': UserRound,
  'kidney-care': Droplet,
  'dental-health': Smile,
  'blood-sugar-health': Thermometer,
  'bone-and-joint-health': Bone,
  'eye-care': Eye,
  ent: Ear,
  'heart-health': HeartPulse,
  'breathing-and-lung-health': Wind,
  'elder-care': Users,
  'weight-management': Scale,
  'pain-management': Brain,
}

export function getSpecialtyIcon(key) {
  return ICON_MAP[key] || ICON_MAP[String(key || '').toLowerCase()] || Stethoscope
}

export default ICON_MAP
