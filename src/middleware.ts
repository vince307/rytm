import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

const PROTECTED_ROUTES = ["/home", "/patterns", "/fixed", "/imports", "/settings"];
const AUTH_ROUTES = ["/login", "/register"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  const path = context.url.pathname.replace(/\/+$/, "") || "/";
  const isProtected = PROTECTED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
  const isAuthRoute = AUTH_ROUTES.includes(path);

  if (isProtected && !context.locals.user) {
    return context.redirect("/login");
  }
  if (isAuthRoute && context.locals.user) {
    return context.redirect("/home");
  }

  return next();
});
