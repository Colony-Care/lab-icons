import { forwardRef } from 'react'
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

export type IconStyle = 'outline' | 'solid' | 'duotone' | 'inverse'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. A number is in pixels; a string is used as is ('1em'). Default 24. */
  size?: number | string
  /** Accessible name. Adds a <title> and role="img". */
  title?: string
  /** Drawing style. Default 'outline'. */
  variant?: IconStyle
}

/** Kept for compatibility: every icon now accepts `variant`, so this is the same as IconProps. */
export type LabIconProps = IconProps

export interface IconVariant {
  /** Root paint attributes of the style file, in React (camelCase) form. */
  attrs: Record<string, string>
  /** Inner markup of the style file. */
  body: string
}

export function createIcon<P extends IconProps = IconProps>(
  displayName: string,
  viewBox: string,
  variants: Partial<Record<IconStyle, IconVariant>> & { outline: IconVariant },
): ForwardRefExoticComponent<P & RefAttributes<SVGSVGElement>> {
  const Icon = forwardRef<SVGSVGElement, P>(function Icon(allProps, ref) {
    // `variant` is removed so it never reaches the DOM.
    const { size = 24, title, variant, ...props } = allProps as IconProps
    const chosen = (variant && Object.prototype.hasOwnProperty.call(variants, variant) && variants[variant]) || variants.outline
    const named = Boolean(title || props['aria-label'] || props['aria-labelledby'])
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        {...chosen.attrs}
        width={size}
        height={size}
        role={named ? 'img' : undefined}
        aria-hidden={named ? undefined : true}
        {...props}
        ref={ref}
      >
        {title ? <title>{title}</title> : null}
        {/* body comes from this repo's own SVG files at build time, never from user input */}
        <g dangerouslySetInnerHTML={{ __html: chosen.body }} />
      </svg>
    )
  })
  Icon.displayName = displayName
  return Icon as ForwardRefExoticComponent<P & RefAttributes<SVGSVGElement>>
}
