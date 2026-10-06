"use client";
import * as React from "react";
import { useActionState } from "react";
import { Blobs, Button, Field, Input, Logo, Notice, Script } from "./primitives";

type AuthState = { error?: string; message?: string } | undefined;
type Action = (prev: AuthState, formData: FormData) => Promise<AuthState>;

/**
 * Full-page login card on the blue ground. Pass server actions from @phanet/supabase/actions.
 * `allowSignUp` turns on the create-account tab (PHANET Academy only).
 */
export function LoginScreen({
  brand, title, scriptWord, subtitle, next = "/", signIn, magicLink, signUp, allowSignUp = false, error,
}: {
  brand: string; title: string; scriptWord?: string; subtitle?: string; next?: string;
  signIn: Action; magicLink?: Action; signUp?: Action; allowSignUp?: boolean; error?: string;
}) {
  const [mode, setMode] = React.useState<"password" | "magic" | "signup">("password");
  const [pwState, pwAction, pwPending] = useActionState(signIn, undefined);
  const [mlState, mlAction, mlPending] = useActionState(magicLink ?? signIn, undefined);
  const [suState, suAction, suPending] = useActionState(signUp ?? signIn, undefined);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const state = mode === "password" ? pwState : mode === "magic" ? mlState : suState;

  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      <div className="container-page pt-6"><Logo text={brand} href="/" /></div>
      <div className="container-page flex-1 grid lg:grid-cols-2 gap-10 items-center py-10">
        <div className="max-w-xl">
          <h1 className="h3d text-[44px] md:text-[64px] leading-[0.98]">
            {title} {scriptWord && <Script peach className="text-[1.2em]">{scriptWord}</Script>}
          </h1>
          {subtitle && <p className="mt-6 text-white text-base md:text-lg max-w-md">{subtitle}</p>}
        </div>
        <div className="card card-lg p-7 md:p-9 w-full max-w-md lg:justify-self-end fade-up">
          <div className="flex gap-2 mb-6 flex-wrap">
            <button type="button" className="chip" data-selected={mode === "password"} onClick={() => setMode("password")}>Password</button>
            {magicLink && <button type="button" className="chip" data-selected={mode === "magic"} onClick={() => setMode("magic")}>Email link</button>}
            {allowSignUp && signUp && <button type="button" className="chip" data-selected={mode === "signup"} onClick={() => setMode("signup")}>Create account</button>}
          </div>
          {(error || state?.error) && <Notice tone="peach" className="mb-4">{error ?? state?.error}</Notice>}
          {state?.message && <Notice tone="mint" className="mb-4">{state.message}</Notice>}

          {mode === "password" && (
            <form action={pwAction} className="flex flex-col gap-4">
              <input type="hidden" name="next" value={next} />
              <Field label="Email"><Input name="email" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" required /></Field>
              <Field label="Password"><Input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required /></Field>
              <Button type="submit" size="lg" disabled={pwPending} className="mt-2">{pwPending ? "Signing in…" : "Sign in →"}</Button>
            </form>
          )}
          {mode === "magic" && magicLink && (
            <form action={mlAction} className="flex flex-col gap-4">
              <input type="hidden" name="next" value={next} />
              <input type="hidden" name="origin" value={origin} />
              <Field label="Email" hint="We'll email you a one-tap sign-in link."><Input name="email" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" required /></Field>
              <Button type="submit" size="lg" disabled={mlPending} className="mt-2">{mlPending ? "Sending…" : "Send me a link →"}</Button>
            </form>
          )}
          {mode === "signup" && signUp && (
            <form action={suAction} className="flex flex-col gap-4">
              <input type="hidden" name="next" value={next} />
              <input type="hidden" name="origin" value={origin} />
              <Field label="Full name"><Input name="full_name" autoComplete="name" placeholder="Ama Owusu" required /></Field>
              <Field label="Email"><Input name="email" type="email" autoComplete="email" placeholder="you@st.knust.edu.gh" required /></Field>
              <Field label="Password" hint="At least 8 characters."><Input name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
              <Button type="submit" size="lg" disabled={suPending} className="mt-2">{suPending ? "Creating…" : "Create account →"}</Button>
            </form>
          )}
          <p className="mt-6 text-xs text-muted">
            {allowSignUp ? "By continuing you agree to use PHANET Academy respectfully." : "Access is granted by the PHANET admin. Contact your executive if you can't sign in."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NoAccess({ brand, home = "/", signOut }: { brand: string; home?: string; signOut?: () => Promise<void> }) {
  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      <div className="container-page pt-6"><Logo text={brand} href={home} /></div>
      <div className="container-page flex-1 grid place-items-center py-10">
        <div className="card card-lg p-9 max-w-md text-center flex flex-col items-center gap-4">
          <span className="dot-orange" style={{ width: 48, height: 48 }} />
          <h1 className="text-2xl">You're signed in, but this portal isn't open to you yet.</h1>
          <p className="text-sm text-muted">Ask the PHANET admin to assign you access. If you think this is a mistake, sign out and back in.</p>
          {signOut && <form action={signOut}><Button variant="ice">Sign out</Button></form>}
        </div>
      </div>
    </div>
  );
}

/** Set or change password, used after an invite / recovery link lands. */
export function SetPasswordScreen({ brand, action, next = "/", email }: { brand: string; action: Action; next?: string; email?: string | null }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <div className="ground-blue min-h-dvh flex flex-col">
      <Blobs />
      <div className="container-page pt-6"><Logo text={brand} href="/" /></div>
      <div className="container-page flex-1 grid lg:grid-cols-2 gap-10 items-center py-10">
        <div className="max-w-xl">
          <h1 className="h3d text-[44px] md:text-[64px] leading-[0.98]">Choose a <Script peach className="text-[1.2em]">password</Script></h1>
          <p className="mt-6 text-white text-base md:text-lg max-w-md">{email ? `You're signed in as ${email}. ` : ""}Pick a password you'll use for every PHANET portal.</p>
        </div>
        <form action={formAction} className="card card-lg p-7 md:p-9 w-full max-w-md lg:justify-self-end flex flex-col gap-4 fade-up">
          <input type="hidden" name="next" value={next} />
          {state?.error && <Notice tone="peach">{state.error}</Notice>}
          <Field label="New password" hint="At least 8 characters."><Input name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Field label="Confirm password"><Input name="confirm" type="password" autoComplete="new-password" minLength={8} required /></Field>
          <Button type="submit" size="lg" disabled={pending} className="mt-2">{pending ? "Saving…" : "Save password →"}</Button>
        </form>
      </div>
    </div>
  );
}
