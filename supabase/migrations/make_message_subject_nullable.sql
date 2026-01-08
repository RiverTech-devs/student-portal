-- Make subject column nullable in messages table
-- Subject line was removed from the UI, so we need to allow null values

ALTER TABLE messages ALTER COLUMN subject DROP NOT NULL;
