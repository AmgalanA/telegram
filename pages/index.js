import Head from 'next/head'
import Sidebar from '../components/Sidebar'
import { auth } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const [user] = useAuthState(auth);

  return (
    <div className="">
      <Head>
        <title>Telegram</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar />

      {/* Chat */}
    </div>
  )
}
