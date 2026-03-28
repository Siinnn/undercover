-- Insertion du thème "Animaux"
WITH theme_animaux AS (
  INSERT INTO themes (name, slug, is_official) 
  VALUES ('Animaux', 'animaux', true)
  RETURNING id
)
INSERT INTO word_pairs (theme_id, word_civil, word_imposter)
SELECT id, 'Chien', 'Chat' FROM theme_animaux UNION ALL
SELECT id, 'Loup', 'Renard' FROM theme_animaux UNION ALL
SELECT id, 'Lion', 'Tigre' FROM theme_animaux UNION ALL
SELECT id, 'Aigle', 'Faucon' FROM theme_animaux UNION ALL
SELECT id, 'Baleine', 'Dauphin' FROM theme_animaux UNION ALL
SELECT id, 'Cheval', 'Âne' FROM theme_animaux UNION ALL
SELECT id, 'Requin', 'Orque' FROM theme_animaux;

-- Insertion du thème "Nourriture"
WITH theme_nourriture AS (
  INSERT INTO themes (name, slug, is_official) 
  VALUES ('Nourriture', 'nourriture', true)
  RETURNING id
)
INSERT INTO word_pairs (theme_id, word_civil, word_imposter)
SELECT id, 'Pizza', 'Burger' FROM theme_nourriture UNION ALL
SELECT id, 'Pomme', 'Poire' FROM theme_nourriture UNION ALL
SELECT id, 'Croissant', 'Pain au chocolat' FROM theme_nourriture UNION ALL
SELECT id, 'Sushi', 'Maki' FROM theme_nourriture UNION ALL
SELECT id, 'Fraise', 'Framboise' FROM theme_nourriture UNION ALL
SELECT id, 'Kebab', 'Tacos' FROM theme_nourriture UNION ALL
SELECT id, 'Glace', 'Sorbet' FROM theme_nourriture;

-- Insertion du thème "Lieux"
WITH theme_lieux AS (
  INSERT INTO themes (name, slug, is_official) 
  VALUES ('Lieux', 'lieux', true)
  RETURNING id
)
INSERT INTO word_pairs (theme_id, word_civil, word_imposter)
SELECT id, 'Paris', 'Londres' FROM theme_lieux UNION ALL
SELECT id, 'Plage', 'Montagne' FROM theme_lieux UNION ALL
SELECT id, 'Cinéma', 'Théâtre' FROM theme_lieux UNION ALL
SELECT id, 'Aéroport', 'Gare' FROM theme_lieux UNION ALL
SELECT id, 'Hôpital', 'Clinique' FROM theme_lieux UNION ALL
SELECT id, 'Supermarché', 'Marché' FROM theme_lieux UNION ALL
SELECT id, 'Piscine', 'Mer' FROM theme_lieux;

-- Insertion du thème "Objets du quotidien"
WITH theme_objets AS (
  INSERT INTO themes (name, slug, is_official) 
  VALUES ('Objets Quotidiens', 'objets-quotidiens', true)
  RETURNING id
)
INSERT INTO word_pairs (theme_id, word_civil, word_imposter)
SELECT id, 'Stylo', 'Crayon' FROM theme_objets UNION ALL
SELECT id, 'Téléphone', 'Ordinateur' FROM theme_objets UNION ALL
SELECT id, 'Montre', 'Horloge' FROM theme_objets UNION ALL
SELECT id, 'Fourchette', 'Cuillère' FROM theme_objets UNION ALL
SELECT id, 'Canapé', 'Fauteuil' FROM theme_objets UNION ALL
SELECT id, 'Livre', 'Magazine' FROM theme_objets UNION ALL
SELECT id, 'Voiture', 'Moto' FROM theme_objets;

-- Insertion du thème "Culture & Loisirs"
WITH theme_culture AS (
  INSERT INTO themes (name, slug, is_official) 
  VALUES ('Culture & Loisirs', 'culture-loisirs', true)
  RETURNING id
)
INSERT INTO word_pairs (theme_id, word_civil, word_imposter)
SELECT id, 'Netflix', 'YouTube' FROM theme_culture UNION ALL
SELECT id, 'Guitare', 'Piano' FROM theme_culture UNION ALL
SELECT id, 'Football', 'Rugby' FROM theme_culture UNION ALL
SELECT id, 'Dessin', 'Peinture' FROM theme_culture UNION ALL
SELECT id, 'Minecraft', 'Roblox' FROM theme_culture UNION ALL
SELECT id, 'Tennis', 'Ping-pong' FROM theme_culture;
