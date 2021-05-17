/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "react-query";
import { LoginPage } from "./pages/public/LoginPage"
import { PrivatePages } from "./pages/private/PrivatePages"
import { UserTokens } from "./hooks/useLogin";

const queryClient = new QueryClient();
export const AuthContext = React.createContext<UserTokens | undefined>(undefined)

export function App() {
  const [tokens, setTokens] = useState<UserTokens>();
  
  useEffect(() => {
    console.log('tokens', tokens)
    return () => { }
  }, [tokens])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={tokens}>

        {tokens ? <PrivatePages/> :<LoginPage onLogin={setTokens}/>}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

// function usePosts() {
//   return useQuery("posts", async () => {
//     const { data } = await axios.get(
//       "https://jsonplaceholder.typicode.com/posts"
//     );
//     return data;
//   });
// }
// function Posts({ setPostId }) {
//   const queryClient = useQueryClient();
//   const { status, data, error, isFetching } = usePosts();

//   return (
//     <div>
//       <h1>Posts</h1>
//       <div>
//         {status === "loading" ? (
//           "Loading..."
//         ) : status === "error" ? (
//           <span>Error: {error.message}</span>
//         ) : (
//           <>
//             <div>
//               {data.map((post) => (
//                 <p key={post.id}>
//                   <a
//                     onClick={() => setPostId(post.id)}
//                     href="#"
//                     style={
//                       // We can access the query data here to show bold links for
//                       // ones that are cached
//                       queryClient.getQueryData(["post", post.id])
//                         ? {
//                             fontWeight: "bold",
//                             color: "green",
//                           }
//                         : {}
//                     }
//                   >
//                     {post.title}
//                   </a>
//                 </p>
//               ))}
//             </div>
//             <div>{isFetching ? "Background Updating..." : " "}</div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// const getPostById = async (id) => {
//   const { data } = await axios.get(
//     `https://jsonplaceholder.typicode.com/posts/${id}`
//   );
//   return data;
// };

// function usePost(postId) {
//   return useQuery(["post", postId], () => getPostById(postId), {
//     enabled: !!postId,
//   });
// }

// function Post({ postId, setPostId }) {
//   const { status, data, error, isFetching } = usePost(postId);

//   return (
//     <div>
//       <div>
//         <a onClick={() => setPostId(-1)} href="#">
//           Back
//         </a>
//       </div>
//       {!postId || status === "loading" ? (
//         "Loading..."
//       ) : status === "error" ? (
//         <span>Error: {error.message}</span>
//       ) : (
//         <>
//           <h1>{data.title}</h1>
//           <div>
//             <p>{data.body}</p>
//           </div>
//           <div>{isFetching ? "Background Updating..." : " "}</div>
//         </>
//       )}
//     </div>
//   );
// }

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
