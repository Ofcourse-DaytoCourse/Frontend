"use client";

import { useTheme, themes, ThemeType } from "@/contexts/theme-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();

  const themeColors = {
    pink: "bg-gradient-to-r from-pink-400 to-rose-400",
    blue: "bg-gradient-to-r from-sky-400 to-cyan-400"
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Palette className="h-5 w-5" />
          색상 테마 선택
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(themes).map(([key, theme]) => (
            <Button
              key={key}
              onClick={() => setTheme(key as ThemeType)}
              variant="outline"
              className={`relative h-20 flex flex-col items-center justify-center gap-2 border-2 transition-all duration-200 hover:scale-105 ${
                currentTheme === key 
                  ? "border-sky-500 bg-sky-50 shadow-lg" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {currentTheme === key && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-sky-600" />
                </div>
              )}
              <div className={`w-8 h-8 rounded-full ${themeColors[key as ThemeType]} shadow-lg`} />
              <span className="text-sm font-medium text-gray-700">{theme.name}</span>
            </Button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          선택한 테마가 전체 페이지에 적용됩니다 ✨
        </p>
      </CardContent>
    </Card>
  );
}