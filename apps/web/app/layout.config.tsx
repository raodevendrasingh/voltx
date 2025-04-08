import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BrandLogoWordmark } from "@/components/BrandLogo";

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
				<BrandLogoWordmark />
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
