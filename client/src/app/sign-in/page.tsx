import { AuthGate } from "src/app/sign-in/AuthGate";

export const metadata = {
  title: "Census | Sign in",
};
const SignInPage = () => {
  // render
  // --------------------
  return <AuthGate />;
};

export default SignInPage;
