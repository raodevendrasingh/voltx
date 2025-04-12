import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/app/layout.config";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "VoltX - AI-native Terminal Experience",
	description:
		"Chat with State-of-the-art LLMs, write scripts, run shell commands, and automate tasks — using natural language.",
};

export default function Layout({ children }: { children: ReactNode }) {
	return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
