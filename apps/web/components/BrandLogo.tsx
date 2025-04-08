import Image from "next/image";
import wordmarkDark from "@/assets/brand/wordmark_dark.png";
import wordmarkLight from "@/assets/brand/wordmark_light.png";

export const BrandLogoWordmark = () => {
	return (
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
	);
};

export const BrandLogoIcon = () => {
	return <div>BrandLogo</div>;
};
