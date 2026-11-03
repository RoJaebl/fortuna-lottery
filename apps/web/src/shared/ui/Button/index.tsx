import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/style/cn";
import { button } from "./Button.styles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

/** 공용 단추 — 실행·보조·글자 단추를 같은 모양으로 그린다 */
export function Button({ intent, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn(button({ intent, size }), className)} {...rest} />;
}
