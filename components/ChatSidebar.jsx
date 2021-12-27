import { collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore"
import moment from "moment";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase"
// import TimeAgo from 'javascript-time-ago';
import ru from 'javascript-time-ago/locale/ru.json';
import TimeAgo from 'timeago-react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import { isShowingImagesState } from "../atoms/conditionalAtom";
import { useRecoilState } from "recoil";
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ModalImage from 'react-modal-image';

const ChatSidebar = ({ members }) => {
    // TimeAgo.addDefaultLocale(ru);
    // const timeAgo = new TimeAgo('ru-RU');
    // const usersRef = collection(db, 'users');

    const [images, setImages] = useState([]);

    const [isShowingImages, setIsShowingImages] = useRecoilState(isShowingImagesState);

    const router = useRouter();
    const imagesRef = collection(db, 'groups', router.query.id, 'messages');
    useEffect(() => {
        const unsubscribe = () => {
            onSnapshot(imagesRef, snapshot => setImages(snapshot.docs.map(doc => doc.data().image && doc.data().image)
            .filter(image => typeof image === 'string')))
        }

        unsubscribe();

    }, []);

    if(!members) return null;

    const [user] = useAuthState(auth);

    return (
        <div className='h-full flex flex-col'>
            {isShowingImages ? (
                <div className='flex flex-col'>
                    <div className='flex items-center'>
                        <div  onClick={() => setIsShowingImages(false)} className='flex items-center cursor-pointer text-white pr-2 pl-1 h-full hover:bg-gray-600'>
                            <ArrowBackOutlinedIcon className=' px-[3px]' />
                        </div>
                        <span className='font-semibold py-2 text-md text-center flex-1 tracking-wider text-white'>Images</span>
                    </div>
                    <div className='grid grid-cols-2'>
                        {/* {images.map(image => <img className='w-50 object-contain' key={image} src={image} />)} */}
                        {images.map(image => <ModalImage 
                            small={image}
                            large={image}
                        />)}
                    </div>
                </div>
            ) : (
                <>
                <span className='font-semibold tracking-wider text-center py-2 text-sm'> {members.length} Members</span>
                {members.map(member => (
                <div key={member.email} className='sticky top-0 flex items-center bg-white p-3 hover:bg-gray-200'>
                    {member.email === user.email ? (
                        <span>You</span>
                    ) : (
                        <>
                            <img src={member.photoURL} className='w-10 h-10 mr-2 rounded-full' />
                            <div>
                                <p className='font-bold tracking-widest text-sm'>{member.name}</p>
                                <div className='text-sm'>
                                    <span>Last seen: </span>
                                    <TimeAgo datetime={member.lastSeen.toDate()} />
                                    {/* {timeAgo.format(member.lastSeen.toDate())} */}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <div className="flex items-center py-3 pl-1 cursor-pointer hover:bg-gray-400 text-white">
                <ImageOutlinedIcon />
                <span className="pl-1" onClick={() => setIsShowingImages(true)}>{images.length} images</span>
            </div>
            </>)}
        </div>
    )
}

export default ChatSidebar
