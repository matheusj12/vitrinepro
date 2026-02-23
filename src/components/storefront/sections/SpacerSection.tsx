import React from "react";
import { SpacerConfig } from "@/types/sections";

interface SpacerSectionProps {
    config: SpacerConfig;
}

export const SpacerSection = ({ config }: SpacerSectionProps) => {
    const { height = "medium", showDivider = false } = config;

    const heightMap = {
        small: "py-4",
        medium: "py-8",
        large: "py-16",
    };

    return (
        <div className={heightMap[height] || heightMap.medium}>
            {showDivider && (
                <div className="container mx-auto px-6">
                    <hr className="border-border/50" />
                </div>
            )}
        </div>
    );
};
