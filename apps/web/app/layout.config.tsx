import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BrandLogoWordmark } from "@/components/BrandLogo";
import { BookOpen } from "lucide-react";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		title: <BrandLogoWordmark />,
	},
	links: [
		{
			text: "Docs",
			icon: <BookOpen />,
			url: "/docs",
			active: "nested-url",
		},
	],
};
