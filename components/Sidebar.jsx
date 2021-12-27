import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import CancelIcon from '@mui/icons-material/Cancel';
import { signOut } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useState, useRef } from "react"
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, getDownloadURL, uploadString } from '@firebase/storage';
import { auth, db, storage } from '../firebase';
import Loader from 'react-loader-spinner';
import Chat from "./Chat";
import { useRecoilState, useRecoilValue } from 'recoil';
import { errorState } from '../atoms/errorAtom';
import SearchInChats from './SearchInChats';
import { queryState } from '../atoms/queryAtom';

const Sidebar = () => {
    const [error, setError] = useRecoilState(errorState);
    const searchingQuery = useRecoilValue(queryState);
    
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [chats, setChats] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isShowingUser, setIsShowingUser] = useState(false);
    const [loading, setLoading] = useState(false);

    const filePickerRef = useRef(null);
    
    const [user] = useAuthState(auth);
    // const orderedCreatedChatsRef = query(createdChatsRef, orderBy('timestamp', 'asc'))

    useEffect(() => {
        const unsubscribe = () => {
            const createdChatsRef = query(collection(db, 'groups'), where('membersEmails', 'array-contains', user?.email));

            onSnapshot(createdChatsRef, snapshot => setChats(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))));
        };
        
        unsubscribe();
    }, []);

    const createChat = async (e) => {
        e.preventDefault();

        setLoading(true);

        if(input && !loading) {
            const docRef = await addDoc(collection(db, 'groups'), {
                creatorEmail: user.email,
                creatorId: user.uid,
                creatorName: user.displayName,
                groupName: input,
                timestamp: serverTimestamp(),
                membersEmails: [user.email],
            });
    
            const imageRef = ref(storage, `groups/${docRef.id}/image`);
    
            await uploadString(imageRef, selectedFile, "data_url").then(async snapshot => {
                const downloadURL = await getDownloadURL(imageRef);
    
                await updateDoc(doc(db, 'groups', docRef.id), {
                    image: downloadURL,
                });
            });
        } else {
            setError('Please enter name of the group...');
        }

        setInput('');
        setLoading(false);
        setSelectedFile(null);
        setOpen(false);
    };

    const addImageToGroup = (e) => {
        const reader = new FileReader();
        if(e.target.files[0]) {
            reader.readAsDataURL(e.target.files[0]);
        }

        reader.onload = (readerEvent) => {
            setSelectedFile(readerEvent.target.result);
        };
    };

    if(user) return (
        <div className='flex flex-col flex-[0.45] h-screen sticky top-0'>
            <div className='flex flex-col items-center bg-blue-300 p-5'>
                <img src={user.photoURL} className='w-10 h-10 rounded-full'/>
                <span onClick={() => setIsShowingUser(!isShowingUser)} className='cursor-pointer text-white font-semibold tracking-wider hover:text-indigo-500 text-center'>Welcome, {user.displayName}!</span>
                {isShowingUser && (
                    <span className='cursor-pointer bg-red-500 w-full text-center font-semibold p-2 rounded-lg mt-2 hover:bg-black text-white ' onClick={() => signOut(auth)}>Log out</span>
                )}
            </div>

            {loading ? (
                <span>Loading...</span>
            ) : (
                <>
                    {/* {error && <span className='bg-red-500 text-center p-3 text-white font-bold tracking-wider cursor-pointer' onClick={() => setError(false)}>{error}</span>} */}

                    <button 
                        onClick={() => setOpen(!open)}
                        className="bg-gray-500 p-3 w-full h-30" 
                        type="button"
                    >Create a chat</button>

                    <SearchInChats />

                    {open && (
                            <div className="absolute h-screen grid bg-gray-500/60 place-items-center  w-full">
                                <form onSubmit={createChat} className='transition-all transform relative p-7 flex flex-col items-center bg-white opacity-100 rounded-lg'>
                                    <CancelIcon onClick={() => setOpen(!open)} className="absolute top-1 right-1 hover:scale-125 cursor-pointer text-red-900 " />
                                    <input value={input} onChange={e => setInput(e.target.value)} className="outline-none w-full bg-none pl-3 m-3" type="text" placeholder="Please enter chat name..." />

                                    {selectedFile ? (
                                        <div className='relative'>
                                            <CancelIcon  onClick={() => setSelectedFile(null)} className='absolute top-5 right-1 cursor-pointer text-red-900 hover:scale-125' />
                                            <img className='w-full object-contain mt-3' src={selectedFile} />
                                        </div>
                                    ) : (
                                        <div onClick={() => filePickerRef.current.click()} className="cursor-pointer flex flex-col items-center bg-red-100 hover:bg-gray-100 rounded-full w-full transition p-3">
                                            <div>
                                                <AddAPhotoIcon />
                                            </div>
                                            <span>Upload a photo</span>
                                        </div> 
                                    )}

                                    <input className="hidden" ref={filePickerRef} type="file" onChange={addImageToGroup} />
                                    <button className='mt-4' type="submit">
                                        <div className='h-10 bg-red-600 text-white rounded-lg px-3 flex align-middle'>
                                            <span className='my-auto'>
                                                Create a new Group
                                            </span>
                                        </div>
                                    </button>
                                </form>
                            </div>
                        )
                    }
                    {/* Chat Row */}
                    {chats.filter(chat => {
                        if(query === "") {
                            return chat;
                        } else if ((chat.groupName.toLowerCase().replace(' ', '')).includes(searchingQuery.toLowerCase().replace(' ', ''))) {
                            return chat;
                        }
                    }).map(chat => (
                        <Chat key={chat.id} id={chat.id} chat={chat}  />
                    ))}
                </>
            )}

            {/* Create Chat */}
        </div>
    );

    return null;
}

export default Sidebar
