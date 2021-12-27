import { signInWithRedirect } from "firebase/auth"
import Head from "next/head"
import { auth, provider } from "../firebase"

const Login = () => {
    const signinWithGoogle = () => {
        signInWithRedirect(auth, provider);
    }

    return (
        <div className="grid place-items-center h-screen">
            <Head>
                <title>Login</title>
            </Head>
            <button onClick={signinWithGoogle}>Sign in with Google</button>
        </div>
    )
}

export default Login
