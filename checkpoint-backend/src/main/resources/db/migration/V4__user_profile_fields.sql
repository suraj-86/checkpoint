ALTER TABLE users
    ADD COLUMN display_name VARCHAR(60),
    ADD COLUMN bio          VARCHAR(300),
    ADD COLUMN goal         VARCHAR(100),
    ADD COLUMN avatar_color VARCHAR(20);
