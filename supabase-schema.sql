-- ============================================
-- Supabase Database Schema for Matrix Netflix App
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Categories Table
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Movies Table
-- ============================================
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    release_year INTEGER,
    rating DECIMAL(3, 1) DEFAULT 0,
    duration INTEGER, -- in minutes
    is_trending BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    is_new_release BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Movie Categories Junction Table (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS movie_categories (
    movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, category_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_movies_trending ON movies(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_movies_popular ON movies(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_movies_new ON movies(is_new_release) WHERE is_new_release = true;
CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Public Read Access Policies
-- ============================================
DROP POLICY IF EXISTS "Public read movies" ON movies;
CREATE POLICY "Public read movies" ON movies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read movie_categories" ON movie_categories;
CREATE POLICY "Public read movie_categories" ON movie_categories FOR SELECT USING (true);

-- ============================================
-- Sample Data (Moved to populate-data.sql)
-- ============================================

-- Use the separate populate-data.sql file to insert movie records and categories.
