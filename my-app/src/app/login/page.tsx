"use client";

import StoreContainer from "@/src/components/StoreContainer";
import { loginStore } from "@/src/core/controllers/login.controller";
import LoginForm from "@/src/components/login/LoginForm";
import { LOGIN_PAGE, LOGIN_BLOB_LAYER, LOGIN_BLOBS } from "@/src/core/ui/login";
import type { LoginPageState } from "@/src/core/models/login";

/** Composition root for the login page: the only subscriber to the login store. */
export default class LoginPage extends StoreContainer<LoginPageState> {
  constructor(props: Record<string, never>) {
    super(props, loginStore);
  }

  render() {
    const state = this.state;
    return (
      <main className={LOGIN_PAGE}>
        <div aria-hidden="true" className={LOGIN_BLOB_LAYER}>
          {LOGIN_BLOBS.map((className, index) => (
            <div key={index} className={className} />
          ))}
        </div>
        <LoginForm
          userInv={state.userInv}
          password={state.password}
          isSubmitting={state.isSubmitting}
          error={state.error}
          onUserInvChange={loginStore.setUserInv}
          onPasswordChange={loginStore.setPassword}
          onSubmit={() => void loginStore.submit()}
        />
      </main>
    );
  }
}
