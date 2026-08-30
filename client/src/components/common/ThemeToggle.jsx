import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'

/**
 * Light/dark switch for the header.
 * Shows the theme the user would move to, which is the convention people
 * expect from a single-button toggle.
 */
export default function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-500',
        'transition hover:bg-ink-50 hover:text-ink-900',
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}
