"use client";

import { Button } from "@/components/ui/button";
import { Copy, Terminal, Check, BookOpen } from "lucide-react";
import { JSX } from "react";
import Link from "next/link";
import { useState } from "react";

export const Hero = (): JSX.Element => {
	const [hasCopied, setHasCopied] = useState(false);

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			return false;
		}
	};

	return (
		<section className="relative min-h-[calc(100vh-8rem)] w-full overflow-hidden">
			{/* Background Grid */}
			<div className="absolute inset-0">
				<div
					className="h-full w-full 
					bg-[linear-gradient(to_right,#4f4f4f2b_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2b_1px,transparent_1px)] 
					bg-[size:64px_64px] 
					[mask-image:radial-gradient(ellipse_80%_50%_at_50%_-20%,#000_70%,transparent_110%)]"
				/>
			</div>

			<div className="container relative z-10">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 md:py-20">
					<div className="flex flex-col justify-center space-y-8 text-center md:text-left">
						<div className="space-y-4">
							<h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-16">
								Supercharge your{" "}
								<span className="text-primary font-mono">
									terminal
								</span>
							</h1>
							<p className="text-lg text-muted-foreground text-pretty">
								An AI-native terminal experience. Chat with
								State-of-the-art LLMs, write scripts, run shell
								commands, and automate tasks — using natural
								language.
							</p>
						</div>

						<div className="flex flex-col space-y-6 ">
							<div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
								<Button
									size="lg"
									className="group"
									onClick={async () => {
										const copied =
											await copyToClipboard(
												"npm i -g voltx",
											);
										if (copied) {
											setHasCopied(true);
											setTimeout(
												() => setHasCopied(false),
												2000,
											);
										}
									}}
								>
									<Terminal className="w-4 h-4 mr-2" />
									npm i -g voltx
									{hasCopied ? (
										<Check className="w-4 h-4 ml-2 text-accent/80 " />
									) : (
										<Copy className="w-4 h-4 ml-2 text-accent/80 group-hover:text-accent" />
									)}
								</Button>
								<Link href="/docs" className="sm:w-auto w-full">
									<Button
										size="lg"
										variant="outline"
										className="w-full sm:w-auto"
									>
										<BookOpen className="w-4 h-4 mr-2" />
										View Documentation
									</Button>
								</Link>
							</div>
						</div>
					</div>

					<div className="relative aspect-video">
						<div className="rounded-lg overflow-hidden border border-border bg-card shadow-2xl">
							<div className="bg-muted p-2 flex items-center gap-2">
								<div className="flex gap-1.5">
									<div className="w-3 h-3 rounded-full bg-destructive" />
									<div className="w-3 h-3 rounded-full bg-yellow-500" />
									<div className="w-3 h-3 rounded-full bg-green-500" />
								</div>
							</div>

							<div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/50">
								<video
									src="https://pub-0ca03071805047dc9370b8f312563c84.r2.dev/media/voltx_demo_1080p.mp4"
									width={1920}
									height={1080}
									className="rounded-b-xl w-full h-full object-cover"
									autoPlay
									loop
									muted
									playsInline
									preload="metadata"
								>
									Your browser does not support the video tag.
								</video>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
