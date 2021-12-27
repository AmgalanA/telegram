import { auth, db, storage } from '../../firebase';
import { doc, getDoc, updateDoc, getDocs, setDoc, serverTimestamp, addDoc, collection, query, orderBy, onSnapshot, where } from '@firebase/firestore';
import Sidebar from '../../components/Sidebar';
import Head from 'next/head';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import { useEffect } from 'react';
import Message from '../../components/Message';
import { useRecoilState } from 'recoil';
import { errorState } from '../../atoms/errorAtom';
import * as EmailValidator from 'email-validator';
import CancelIcon from '@mui/icons-material/Cancel';
import ChatSidebar from '../../components/ChatSidebar';
import { useDebounce } from 'use-debounce';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

const Group = () => {
    // const chat = JSON.parse(chat);
    const router = useRouter();
    const [user] = useAuthState(auth);
    
    const [input, setInput] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [debouncedMemberEmail] = useDebounce(memberEmail, 500);

    const [members, setMembers] = useState([]);
    const [membersEmails, setMembersEmails] = useState([]);
    const [users, setUsers] = useState([]);

    const [messages, setMessages] = useState([]);
    const [chat, setChat] = useState({});
    
    const [showingMessages, setShowingMessages] = useState([]);
    const [isShowingSettings, setIsShowingSettings] = useState(false);
    const [isShowingAddMember, setIsShowingAddMember] = useState(false);
    const [isShowingMembers, setIsShowingMembers] = useState(false);
    const [loading, setLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);

    const [error, setError] = useRecoilState(errorState);

    const endOfMessagesRef = useRef(null);
    const filePickerRef = useRef(null);
    
    const messagesRef = query(collection(db, 'groups', router.query.id, 'messages'), orderBy('timestamp', 'asc'));
    const membersRef = doc(db, 'groups', router.query.id);
    const usersRef = collection(db, 'users');
    // onSnapshot(membersRef, snapshot => setMembers(snapshot.data().members));
    
    useEffect(async () => {
            onSnapshot(messagesRef, snapshot => {
                setShowingMessages(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })));
            });
    }, [messages]);

    useEffect(() => {
        onSnapshot(usersRef, snapshot => setUsers(snapshot.docs.map(doc => ({
            email: doc.data().email,
         }))));
    }, []);

    useEffect(() => {
        const unsubscribe = () => {
            onSnapshot(membersRef, snapshot => setMembers(snapshot.data().members));
    
            onSnapshot(membersRef, snapshot => setMembersEmails(snapshot.data().membersEmails));
        }

        unsubscribe();

    }, [router.query.id]);

    useEffect(() => {
        const unsubscribe = async () => {
            setLoading(true);
            const ref = doc(db, 'groups', router.query.id);
    
            // Prep the messages
            const messagesRef = await getDocs(query(collection(ref, 'messages'), orderBy('timestamp', 'asc')));

            const messages = messagesRef.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })).map(messages => ({
                ...messages,
                timestamp: serverTimestamp(),
            }));

            // Prep the chat
            const chatRef = await getDoc(ref);
            const chat = {
                id: chatRef.id,
                ...chatRef.data(),
            };

            setMessages(messages);
            setChat(chat);
            setLoading(false);
        }
        
        unsubscribe();
    }, [router.query.id]);

    const sendMessage = async (e) => {
        setLoading(true);
        e.preventDefault();
        
        if(input || selectedFile) {
            setDoc(doc(db, 'users', user.uid), {
                lastSeen: serverTimestamp()
            }, {
                merge: true,
            });
    
            const docRef = await addDoc(collection(db, 'groups', router.query.id, 'messages'), {
                email: user.email,
                name: user.displayName,
                id: user.uid,
                timestamp: serverTimestamp(),
                photoURL: user.photoURL,
                text: input,
            });
    
            if(selectedFile) {
                const imageRef = ref(storage, `messages/${docRef.id}/images`);
    
                await uploadString(imageRef, selectedFile, 'data_url').then(async snapshot => {
                    const downloadURL = await getDownloadURL(imageRef);
    
                    await updateDoc(doc(db, 'groups', router.query.id, 'messages', docRef.id), {
                        image: downloadURL,
                    });
                })
            }
        } else {
            return;
        }

        setInput('');
        setSelectedFile('');
        setLoading(false);
        scrollToBottom();
    };
    
    const scrollToBottom = () => {
        endOfMessagesRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const addMember = () => {
        if (!debouncedMemberEmail) return;

        setLoading(true);

        if(EmailValidator.validate(debouncedMemberEmail)) {
            if(!userAlreadyInGroup(debouncedMemberEmail)) {
                const userRef = query(collection(db, 'users'), where('email', '==', debouncedMemberEmail));
                onSnapshot(userRef, snapshot => {
                    if (members) {
                        setDoc(doc(db, 'groups', router.query.id), {
                            members: [...members, snapshot.docs[0].data()],
                            membersEmails: [...membersEmails, snapshot.docs[0].data().email]
                        }, {
                            merge: true
                        });
                    } else {
                        setDoc(doc(db, 'groups', router.query.id), {
                            membersEmails: [snapshot.docs[0].data().email, user.email],
                            members: [snapshot.docs[0].data()],
                        }, {
                            merge: true
                        });
                    }
                    
                })
            } else {
                setError('This member is already in chat');
            }
                   
            setMemberEmail('');
            setLoading(false);
        } else {
            setError('Invalid Email');
        }
    };

    const userAlreadyInGroup = (memberEmail) => !!members?.find(member => member.email === memberEmail);;
    
    const addImageToMessage = (e) => {
        const reader = new FileReader();
        if(e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }

        reader.onload = (readerEvent) => {
            setSelectedFile(readerEvent.target.result);
        };
    };

    if(loading) return 'Loading...';

    return (
        <div className='flex flex-1'>
            <Head>
                <title>{chat?.groupName}</title>
            </Head>

            <Sidebar />
            
            <div className="flex-1">
                {error && (
                    <div className='relative'>
                        <span className='bg-red-500 text-center p-3 flex flex-1 text-white font-bold tracking-wider'>
                            {error}
                        </span>
                        <CancelIcon  onClick={() => setError(false)} className='absolute top-1 right-1 cursor-pointer text-white' />
                    </div>
                    )}
                <div className='sticky top-0 flex flex-col border-b-4 w-full font-semibold tracking-wider text-start pl-4 py-2 z-50 bg-white'>
                    <div className='flex flex-1'>
                        <span className='flex-1 my-auto'>{chat?.groupName}</span>
                        
                        <div className='flex-1'>
                            {!loading ? <img src={chat.image} className='w-16 h-16 rounded-full' /> : 'loading...'}
                        </div>
                        
                        <SettingsIcon className={`mr-4 transition-all cursor-pointer my-auto ${isShowingSettings ? 'text-red-500' : 'text-black'}`} onClick={() => setIsShowingSettings(!isShowingSettings)} />
                    </div>

                    {isShowingSettings && (
                        <div className='absolute top-16 flex flex-col bg-gray-200 p-3 right-0 mr-3 rounded-lg'>
                            <span className='cursor-pointer' onClick={() => setIsShowingAddMember(!isShowingAddMember)}>Add Member</span>
                            {isShowingAddMember ? (
                                <div className='flex flex-col items-center'>
                                    <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)} className='bg-none outline-none p-2 rounded-lg mt-2' placeholder="Input email" />    
                                    <button className={`mt-3  w-full p-1 hover:bg-white hover:text-black ${!memberEmail ? 'bg-gray-100 text-black' : 'bg-black text-white'} rounded-lg cursor-pointer`} disabled={!memberEmail} onClick={addMember}>Add Member</button>
                                </div>
                            ) : (
                                <>
                                    <span className='cursor-pointer' onClick={() => setIsShowingMembers(!isShowingMembers)}>
                                        {isShowingMembers ? 'Hide all members' : 'Show all members'}
                                    </span>                                
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="min-h-[83vh] bg-[url('https://cutewallpaper.org/21/telegram-wallpaper/Telegram-background-3-At-Background-Check-All.jpg')]">
                    {/* Show messages */}
                    {showingMessages?.map((message, i) => <Message key={i} order={i} message={message} />)}

                    <div ref={endOfMessagesRef} />
                </div>
                <form onSubmit={sendMessage}  className="sticky bottom-0 min-h-[30px] w-full border">
                        <fieldset disabled={loading && 'disabled'}>
                        {selectedFile && (
                            <div className='bg-white py-3 pl-1'>
                                <img className='w-16 h-16' src={selectedFile} />
                                <CancelIcon onClick={() => setSelectedFile('')} className='absolute top-2 cursor-pointer left-14' />
                            </div>
                        )}
                        <InsertLinkIcon onClick={() => filePickerRef.current.click()} className={`absolute ${selectedFile ? 'bottom-3' : 'top-3'} left-1 cursor-pointer `}/>
                        <input value={input} onChange={e => setInput(e.target.value)} className='w-full py-3 pl-9 bg-white outline-none' placeholder="Write a message..." type="text" />
                        <SendIcon onClick={sendMessage} className={`absolute right-0 ${selectedFile ? 'bottom-3' : 'top-3'} cursor-pointer text-blue-600`} />
                        <input 
                            hidden 
                            type='file' 
                            ref={filePickerRef} 
                            onChange={addImageToMessage}
                        />
                        <button hidden disabled={!input && loading} type='submit' />
                    </fieldset>
                </form>
            </div>
            {isShowingMembers && (
                <div className='sticky top-0 flex flex-col h-screen w-[28%] whitespace-nowrap bg-indigo-900'>
                    {members ? (
                        <>
                            <ChatSidebar members={members} />
                        </>
                    )
                    : (
                        <>
                            <span className='font-semibold tracking-wider text-center my-2'>Members: Only you</span>
                            <span className='font-semibold tracking-wider text-center'>Start adding some!</span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default Group;

// export async function getServerSideProps(context) {
//     const ref = doc(db, 'groups', context.query.id);
    
//     // Prep the messages
//     const messagesRef = await getDocs(query(collection(ref, 'messages'), orderBy('timestamp', 'asc')));

//     const messages = messagesRef.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//     })).map(messages => ({
//         ...messages,
//         timestamp: serverTimestamp(),
//     }));

//     // Prep the chat
//     const chatRef = await getDoc(ref);
//     const chat = {
//         id: chatRef.id,
//         ...chatRef.data(),
//     };

//     return {
//         props: {
//             messages: JSON.stringify(messages),
//             chat: JSON.stringify(chat),
//         }
//     }
// };
