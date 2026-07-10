# Holy Brunch × Christ's Lovers — Site d'inscription

4 éléments :
- `index.html` → page publique (inscription, jauge, compte à rebours)
- `admin.html` → ton espace privé pour voir/exporter la liste
- `supabase/functions/send-ticket/` → la fonction qui envoie le ticket par mail via ton compte Gmail, en gardant tes identifiants secrets
- ce README → la config à faire

Il te faut ton compte **Supabase** (déjà fait ✅) et ton compte **Gmail** habituel — pas besoin de domaine ni de nouveau service. Il reste juste à créer la table et déployer la fonction.

---

## 1. Supabase (base de données + compteur)

Ton URL et ta clé publique sont déjà dans le code. Il reste juste à créer la table :

1. Va sur [supabase.com](https://supabase.com) → ouvre ton projet.
2. Une fois le projet créé, ouvre l'onglet **SQL Editor** → **New query**, colle ceci et clique **Run** :

```sql
create table inscriptions (
  id uuid primary key default gen_random_uuid(),
  ticket_number serial,
  created_at timestamptz default now(),
  nom text not null,
  prenom text not null,
  communaute text not null,
  ville text not null,
  whatsapp text not null,
  decouverte text,
  email text not null,
  checked_in boolean default false
);

alter table inscriptions enable row level security;

create policy "Public peut inscrire" on inscriptions
  for insert to anon
  with check (true);

create policy "Admin peut tout lire" on inscriptions
  for select to authenticated
  using (true);

create policy "Admin peut modifier" on inscriptions
  for update to authenticated
  using (true);

create or replace function get_registration_count()
returns integer
language sql
security definer
as $$
  select count(*)::integer from inscriptions;
$$;

grant execute on function get_registration_count() to anon;
```

Cela crée la table, et protège les données : n'importe qui peut s'inscrire, mais **seul toi (admin connecté)** peux lire la liste complète. Le public ne voit que le nombre total via le compteur.

3. Va dans **Authentication → Users → Add user** et crée ton compte admin (ton e-mail + un mot de passe). C'est ce compte que tu utiliseras pour te connecter sur `admin.html`.

---

## 2. Gmail (envoi automatique du ticket)

⚠️ Le mot de passe d'application Gmail est **secret** : il ne doit jamais apparaître dans `index.html` ou tout autre fichier envoyé sur GitHub. Il est donc configuré comme "secret" côté Supabase, et une petite fonction serveur (déjà écrite, dans `supabase/functions/send-ticket/index.ts`) l'utilise pour envoyer le mail à ta place, via ton compte Gmail.

**A. Créer un mot de passe d'application Gmail (5 min) :**

1. Ton compte Gmail doit avoir la **validation en 2 étapes** activée : [myaccount.google.com/security](https://myaccount.google.com/security) → Validation en 2 étapes → active-la si ce n'est pas déjà fait.
2. Va sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Donne un nom (ex. "Holy Brunch") → **Créer**. Google affiche un mot de passe à 16 caractères (ex. `abcd efgh ijkl mnop`) — copie-le, il ne sera montré qu'une fois.

**B. Déployer la fonction (dans un terminal, sur ton PC) :**

1. Installe la CLI Supabase si ce n'est pas déjà fait :
   ```
   npm install -g supabase
   ```
2. Connecte-toi et lie le projet :
   ```
   supabase login
   supabase link --project-ref kmnavmsbdahwqftjhvzj
   ```
3. Enregistre ton adresse Gmail et le mot de passe d'application comme secrets (jamais visibles dans le code) :
   ```
   supabase secrets set GMAIL_USER=tonadresse@gmail.com
   supabase secrets set GMAIL_APP_PASSWORD="abcdefghijklmnop"
   ```
   (colle le mot de passe à 16 caractères sans les espaces)
4. Déploie la fonction :
   ```
   supabase functions deploy send-ticket
   ```

C'est tout — les mails partiront depuis ton adresse Gmail, à n'importe quel inscrit, sans limite de domaine. Un compte Gmail standard peut envoyer jusqu'à 500 mails/jour, largement suffisant pour 200 inscrits.

---

## 3. Mise en ligne

Ton URL Supabase et ta clé publique sont déjà intégrées dans `index.html` et `admin.html` — tu n'as rien à modifier dans ces deux fichiers. Comme pour tes autres sites : dépose-les sur GitHub puis déploie sur Netlify (le dossier `supabase/` peut aussi être poussé sur GitHub sans risque, il ne contient aucune clé secrète).

- Page publique : `tonsite.netlify.app/`
- Page admin (à ne partager avec personne) : `tonsite.netlify.app/admin.html`

---

## Notes utiles

- La jauge flamme et le compteur se basent sur le vrai nombre d'inscrits dans Supabase — automatique, pas besoin d'y toucher.
- Le compte à rebours est fixé au **21 juillet 2026, 23h59**. Pour changer la date, modifie `EVENT_DEADLINE` dans `index.html`.
- Passé 200 inscrits (ou la date limite), le formulaire se ferme tout seul et affiche "COMPLET".
- Sur `admin.html`, tu peux chercher un inscrit, exporter toute la liste en CSV (pour l'ouvrir dans Excel), et cocher les gens "présents" le jour J.
- Le ticket est envoyé **entièrement automatiquement** dès qu'une personne s'inscrit, via la fonction Supabase qui utilise ton compte Gmail — tu n'as rien à faire une fois la fonction déployée.

