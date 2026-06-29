<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9be32a01-6c26-457e-a386-c0d6dc0687e2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

   
We built Civic Guard because we were tired of the same story: you spot a pothole, a busted streetlight, a drain that's been overflowing for two weeks — and you just... move on. Because what's the point? There's no easy way to report it, and even if there were, nothing would happen anyway.
Civic Guard changes that equation.
It's a two-sided mobile app — one side for citizens to file complaints in under a minute using a live photo, the other for government employees to manage, respond to, and close those complaints within their assigned district. The key word there is close — because closing a complaint on Civic Guard isn't as simple as clicking a button. Officers have to upload a live photo from within 15 metres of the original location. No photo from the spot, no resolution accepted.
And if a citizen thinks the "resolved" tag is a lie? They can challenge it — with their own live photo and GPS proof. If verified, the complaint goes straight back to Pending.
Under the hood, there's an AI image similarity checker that compares complaint photos against resolution proofs, looking at roads, buildings, poles, and landmarks to confirm both images were actually taken at the same place. There's a peer verification system where community members can earn coins for physically visiting and confirming a reported issue. And there's a national leaderboard that turns civic participation into something people actually want to do.
It's not a perfect solution to a complex problem. But it's a real one — and it's built around the people it's supposed to serve.
