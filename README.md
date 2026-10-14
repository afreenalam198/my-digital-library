# Afreen's Library

Afreen's Library is a shared digital bookshelf. Anyone with the link can browse the shelves. The owner signs in to manage books they have already read. Visitors can suggest books for the To Be Read shelf.

The interface is a hand-drawn library: a welcome door, wooden shelves, and flat colored spines. Book details, covers, and descriptions come from [Open Library](https://openlibrary.org). The shared collection lives in Supabase, and the site is a static Vite app hosted on Vercel.

This project was built using Cursor Pro for the MLH Hacktoberfest.

## Stack

* [Vite](https://vite.dev) and React, with React Router
* [Supabase](https://supabase.com) for the shared table, authentication, and row-level security
* [Open Library](https://openlibrary.org) for search, covers, subjects, and descriptions
* [@huggingface/transformers](https://huggingface.co/docs/transformers.js) for in-browser semantic search
* Vercel for hosting

## Shelves

The front door has two leaves.

* **To Be Read** opens the books still waiting to be read. A book here can have a cover, title, author, genre, a short description, and an optional note.
* **Books I've Read** opens finished books. Each one can also have a rating from one to five hearts and a written review.

Selecting a spine opens the book. The page shows the photographic cover when Open Library has one, and a drawn cover in the book's spine color when it does not.

## Who can change what

There are two ways to use the same site. Signing in does not open a separate address. A signed-in session is the owner. Everyone else is a visitor.

| Action | Visitor | Owner |
| --- | --- | --- |
| View both shelves | Yes | Yes |
| Add, edit, or delete a To Be Read book | Yes | Yes |
| Add, edit, or delete a book on Books I've Read | No | Yes |
| Mark a To Be Read book as read | No | Yes |
| Move a read book back to To Be Read | No | No |

The owner signs in by selecting the welcome sign above the doors. Public sign-ups stay off in Supabase, so a visitor cannot create an account and become the owner. Any signed-in user is treated as the owner. This is safe because this project has a single account.

Supabase row-level security policies allow visitors to insert, update, and delete only rows whose status is `tbr`, and only when those rows have no rating and an empty review. Signed-in requests can change either shelf. The React routes follow the same rules, so a visitor who types `/new/read` or opens the finish form is sent away.

## How a book is added

From a shelf, **Add a book** opens a form for that shelf. The title field searches Open Library as the person types. Choosing a match stores the work id, author, cover, genre, and description. A typed or pasted title is limited to 150 characters. A catalog match can keep its full title.

The app only accepts cover images sourced directly from Open Library. The client trims and limits text fields before saving them. On the shelf, long titles wrap onto the next line of the spine without expanding past the set height limit, trailing off with an ellipsis if they still do not fit. On the book page, titles longer than 50 characters wrap automatically.

## Search

**Look for books** searches the shelf the person came from. It does not search the public catalog. The browser downloads a small MiniLM model and compares the query with each book's description, genre, title, author, note, and review. The model runs locally, so search does not need another server. The first load takes longer while the model downloads.

## How the project was built

The library started as a private bookshelf in the browser. Books were stored in `localStorage` under `afreen-library-books`. That made the first version simple: no account, no database, and the shelves survived a refresh on the same computer. It could not be shared. A second person opening the site would see an empty library.

Moving to a published, shareable state required splitting the architecture. The pages are static, so Vercel can build and host them. The books have to live somewhere every visitor can read, so the collection moved to Supabase.

Splitting permissions between the owner and visitors drove the main product architecture. A second site, or a secret URL, would have been easy to leak and hard to keep in sync. One site, with the session deciding the view, keeps a single bookshelf. Visitors get more than read-only access on the To Be Read shelf: they can add, correct, or remove suggestions. They cannot rate a book, write a review, or mark it read, because those belong to the owner. They also cannot change Books I've Read.

Supabase Row-Level Security (RLS) enforces these rules at the database level. The interface hides the buttons, and the policies reject the write if someone bypasses the interface. Client-side validation also checks saves before deployment: it refuses empty titles, restricts ratings to 1 through 5, blocks To Be Read rows from carrying a rating or review, and ensures cover addresses match Open Library.

Search runs entirely in the browser to maintain the serverless, lightweight approach of the first version. A hosted search API would have been another account and another place to store book text. MiniLM is small enough to run on the page, and it can match a description even when the query does not repeat the title.

## Run it locally

```bash
npm install
npm run dev

```

Create a `.env` file in the project root. Do not commit it.

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=your_publishable_key

```

`SUPABASE_KEY` is the publishable anon key from the Supabase project settings. Vite is configured to expose variables that start with `SUPABASE_` to the browser. Restart the dev server after changing `.env`.

Without those variables, the app uses `localStorage` and treats the browser as the owner. With them, the shelves load from Supabase.

```bash
npm test
npm run build

```

## Database

In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) once. The script creates `public.books`, enables row-level security, and adds the visitor and owner policies. It does not delete existing rows if the table is already there.

Then, in Authentication settings:

1. Turn off public sign-ups.
2. Create one owner user.
3. Sign in on the site by selecting the welcome sign.

## Deploy

The GitHub repository is [afreenalam198/my-digital-library](https://github.com/afreenalam198/my-digital-library). Vercel builds the Vite app and publishes the `dist` folder. [`vercel.json`](vercel.json) rewrites every path to `index.html`, so a refresh on `/read` or `/book/...` still opens the app.

In the Vercel project, set these production variables to the same values as `.env`:

* `SUPABASE_URL`
* `SUPABASE_KEY`
