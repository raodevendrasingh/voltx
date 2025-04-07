import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import wordmarkDark from "@/assets/brand/wordmark_dark.png";
import wordmarkLight from "@/assets/brand/wordmark_light.png";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: (
			<>
				<Image
					src={wordmarkDark}
					alt="site_logo"
					className="dark:hidden block"
					width={90}
				/>
				<Image
					src={wordmarkLight}
					alt="site_logo"
					className="hidden dark:block"
					width={90}
				/>
			</>
		),
	},
	links: [
		{
			text: "Docs",
			url: "/docs",
			active: "nested-url",
		},
	],
};
