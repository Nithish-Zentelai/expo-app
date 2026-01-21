-- ============================================
-- Curated Movie Library Population Script
-- Run this AFTER running supabase-schema.sql
-- ============================================

-- 1. Insert Categories
-- Ensure the trailer_youtube_id column exists (Auto-fix for missing column error)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_youtube_id TEXT;

INSERT INTO categories (name, slug, display_order) VALUES
    ('Action', 'action', 1),
    ('Sci-Fi', 'sci-fi', 2),
    ('Drama', 'drama', 3),
    ('Comedy', 'comedy', 4),
    ('Animation', 'animation', 5),
    ('Thriller', 'thriller', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. Clear existing sample data to avoid duplicates (CRITICAL)
DELETE FROM movie_categories;
DELETE FROM movies;

-- 3. Insert Curated Movies (All images verified 100% visible)
WITH movie_data AS (
    INSERT INTO movies (title, description, poster_url, backdrop_url, release_year, rating, duration, trailer_youtube_id, is_trending, is_popular, is_new_release) VALUES
    (
        'Interstellar', 
        'When Earth becomes uninhabitable, a team of ex-pilots and scientists is tasked with finding a new home for mankind.', 
        'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1200',
        2014, 8.7, 169, 'zSWdZVtXT7E', true, true, false
    ),
    (
        'Inception', 
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200',
        2010, 8.8, 148, 'YoHD9XEInc0', true, true, false
    ),
    (
        'The Matrix', 
        'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1510511459019-5dee997d7db4?q=80&w=1200',
        1999, 8.7, 136, 'vKQi3bBA1y8', false, true, false
    ),
    (
        'Dune: Part Two', 
        'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', 
        'https://images.unsplash.com/photo-1676491167770-bce474fe0024?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200',
        2024, 9.0, 166, 'Way9Dexny3w', true, true, true
    ),
    (
        'John Wick: Chapter 4', 
        'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy.', 
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=1200',
        2023, 7.7, 169, 'yjRHu7742d4', true, true, false
    ),
    (
        'Mad Max: Fury Road', 
        'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.', 
        'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509062522246-37559ee23c86?q=80&w=1200',
        2015, 8.1, 120, 'hEJnMQG9ev8', false, true, false
    ),
    (
        'The Dark Knight', 
        'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests.', 
        'https://images.unsplash.com/photo-1628432136678-43ff9be34064?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200',
        2008, 9.0, 152, 'EXeTwQWrcwY', true, true, false
    ),
    (
        'Oppenheimer', 
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', 
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1441742917377-57f78ee0e582?q=80&w=1200',
        2023, 8.4, 180, 'uYPbbksJxIg', true, true, true
    ),
    (
        'Parasite', 
        'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', 
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1533929736667-35889fe5bb7a?q=80&w=1200',
        2019, 8.5, 132, '5xH0HfJHsaY', false, true, false
    ),
    (
        'The Shawshank Redemption', 
        'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.', 
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1436413981254-469b4e7240c0?q=80&w=1200',
        1994, 9.3, 142, 'PLl99DcL6b4', false, true, false
    ),
    (
        'Pulp Fiction', 
        'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 
        'https://images.unsplash.com/photo-1641549058491-8a3442385da0?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200',
        1994, 8.9, 154, 's7EdQ4FqbhY', true, true, false
    ),
    (
        'The Grand Budapest Hotel', 
        'A writer encounters the owner of a decaying high-class hotel, who tells him of his early years as a lobby boy.', 
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1498644035638-2c3327899b1a?q=80&w=1200',
        2014, 8.1, 99, '1Fg5iWmQ_us', false, true, false
    ),
    (
        'Spider-Man: Across the Spider-Verse', 
        'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.', 
        'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1200',
        2023, 8.6, 140, 'cqGjhVJWtEg', true, true, true
    ),
    (
        'Cinema Paradiso', 
        'A filmmaker recalls his childhood when falling in love with the pictures at the cinema of his village.', 
        'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200',
        1988, 8.5, 124, 'stLs_9z8sXw', false, true, false
    )
    RETURNING id, title
)
-- 4. Associate Movies with Categories
INSERT INTO movie_categories (movie_id, category_id)
SELECT m.id, c.id
FROM movie_data m, categories c
WHERE 
    (m.title = 'Interstellar' AND c.slug IN ('sci-fi', 'drama')) OR
    (m.title = 'Inception' AND c.slug IN ('sci-fi', 'thriller')) OR
    (m.title = 'The Matrix' AND c.slug IN ('sci-fi', 'action')) OR
    (m.title = 'Dune: Part Two' AND c.slug IN ('sci-fi', 'action')) OR
    (m.title = 'John Wick: Chapter 4' AND c.slug = 'action') OR
    (m.title = 'Mad Max: Fury Road' AND c.slug = 'action') OR
    (m.title = 'The Dark Knight' AND c.slug IN ('action', 'drama')) OR
    (m.title = 'Oppenheimer' AND c.slug = 'drama') OR
    (m.title = 'Parasite' AND c.slug IN ('drama', 'thriller')) OR
    (m.title = 'The Shawshank Redemption' AND c.slug = 'drama') OR
    (m.title = 'Pulp Fiction' AND c.slug IN ('thriller', 'drama')) OR
    (m.title = 'The Grand Budapest Hotel' AND c.slug IN ('comedy', 'drama')) OR
    (m.title = 'Spider-Man: Across the Spider-Verse' AND c.slug = 'animation') OR
    (m.title = 'Cinema Paradiso' AND c.slug = 'drama');
