import { useRecoilState } from "recoil"
import { queryState } from "../atoms/queryAtom";


const SearchInChats = () => {
    const [query, setQuery] = useRecoilState(queryState);

    return (
        <div className="w-full">
            <input value={query} onChange={e => setQuery(e.target.value)} className='p-2 w-full outline-none border-b-2' placeholder="Search In Chats..." />
        </div>
    )
}

export default SearchInChats
