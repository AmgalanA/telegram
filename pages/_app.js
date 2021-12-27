import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import Loader from 'react-loader-spinner';
import { RecoilRoot } from 'recoil'
import { auth, db } from '../firebase';
import '../styles/globals.css'
import Login from './login';

function MyApp({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth);
  
  useEffect(() => {
    if (user) {
      setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        lastSeen: serverTimestamp(),
        photoURL: user.photoURL,
        id: user.uid,
        name: user.displayName,
      });
    };
  }, [user]);

  if (loading) return (
    <div className="flex justify-center items-center">
      <Loader type="Puff" color="#4995BE" height={550} width={80} />
    </div>
  )

  if(!user) return <Login />

  return (
  <RecoilRoot>
    <Component {...pageProps} />
  </RecoilRoot>
  )
}

export default MyApp
