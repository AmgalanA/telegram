import { useRouter } from "next/router";

const Chat = ({ id, chat }) => {
    const router = useRouter();

    const enterChat = () => {
        router.push(`/groups/${id}`);
    }

    return (
        <div onClick={enterChat} className="flex max-h-[90px] items-center py-3 flex-1 cursor-pointer hover:bg-gray-200">
            <img className='w-8 h-8 rounded-full object-cover mx-2' src={chat.image} alt="" />
            <span className='font-semibold tracking-wider text-sm'>{chat.groupName}</span>
        </div>
    )
}

export default Chat
