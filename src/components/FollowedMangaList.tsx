import axios from "axios";
import { useQuery } from "react-query";

interface FollowedMangaList {
  id: string;
}

// TODO finish implementation
export function FollowedMangaList() {
  const { data } = useQuery("followed-manga-list", () => {
    return axios.get<FollowedMangaList>(
      "https://api.mangadex.org/user/follows/manga/feed"
    );
  });
  return <div>{JSON.stringify(data)}</div>;
}
