import { useState, useEffect, lazy } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Timeago from 'timeago-react';
import ModalImage from 'react-modal-image';

const Message = ({ message, order }) => {
    const [user] = useAuthState(auth);
    const [color, setColor] = useState(null);

    const colors = [
        'text-indigo-500', 
        'text-pink-500', 
        'text-blue-500', 
        'text-green-500', 
        'text-purple-500'
    ];

    useEffect(() => {
        setColor(colors[Math.floor(Math.random() * colors.length)]);
    }, []);

    return (
        <div className={`${message.id === user.uid ? ' bg-blue-900' : `bg-sky-900`} ${order === 0 ? 'mt-0' : 'mt-5'} flex flex-col rounded-lg ml-4 w-[60%] text-white`}>
            <div className='flex items-center'>
                {message.id !== user.uid && (
                <div className='p-2 pb-3 flex items-center'>
                    <img className='h-8 w-8 rounded-full' src={user.photoURL} />
                    <span className={`pl-2 font-semibold ${color}`}>{message.name}</span>
                </div>
                )}
            </div>
            {message.image && (
                <>
                <ModalImage 
                    className={`${message.text ? 'mb-5' : 'mb-0'}`}
                    small={message.image}
                    large={message.image}
                />
                </>
                
                )}
            <div>
            <div className='flex flex-col px-2'>
                <span className={`text-sm`}>{message.text}</span>
                <Timeago className={`text-xs ${!message.text ? 'hidden' : 'flex flex-col items-end mb-2'}`} datetime={message?.timestamp?.toDate()} />
            </div>
            </div>
        </div>
    )
}

export default Message
