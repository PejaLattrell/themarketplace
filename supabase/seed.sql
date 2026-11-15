-- Optional sample data. Every item is clearly marked as a sample, not for sale.
insert into public.marketplace_listings(title,description,price,category,image_path,seller_name,location,condition,is_demo,seller_email,created_at) values
('A chair worth staying in','A warm oak lounge chair with a woven seat and a lovely lived-in finish. Comfortable, sturdy, and perfect for a reading corner.

Light wear on the legs from everyday use. Approximately 28 in wide × 30 in deep. Local pickup; happy to help load it.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','85','Furniture','https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=85','Alex','Portland, OR','Good',true,'demo@example.com',now()-interval '1 hours'),
('Fujifilm, for the little moments','A compact camera for spontaneous walks, weekend trips, and all the little moments worth keeping. Includes a wrist strap and a protective carry case.

Clean body and lens, tested and working. A few light marks on the underside.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','240','Electronics','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85','Jamie','Brooklyn, NY','Like new',true,'demo@example.com',now()-interval '2 hours'),
('A softer kind of light','A simple table lamp that brings a little warmth to any bedside or reading nook. A neutral shade and an understated shape that fits almost anywhere.

Works perfectly. Standard bulb fitting. Collection available on weekends.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','35','Home & Living','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85','Morgan','Austin, TX','Good',true,'demo@example.com',now()-interval '3 hours'),
('Your next everyday sneakers','A bright pair of sneakers ready for more adventures. Comfortable, clean, and easy to wear with almost everything.

US size 9. Light signs of wear on the sole, with plenty of life left. From a smoke-free home.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','45','Fashion','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85','Sam','Seattle, WA','Like new',true,'demo@example.com',now()-interval '4 hours'),
('A soundtrack of your own','Over-ear headphones with a comfortable fit and a wonderfully full sound. Great for focused afternoons and getting lost in your favorite album.

Includes the audio cable. Ear pads are clean and soft. Fully working.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','60','Electronics','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85','Taylor','Chicago, IL','Like new',true,'demo@example.com',now()-interval '5 hours'),
('A few very good stories','A small collection of well-loved books looking for their next reader. A lovely mix for slow weekends and quiet evenings.

Some light creasing and the occasional penciled note. Pages are intact. Selling as a set.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','18','Books & Hobbies','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85','Casey','Denver, CO','Well loved',true,'demo@example.com',now()-interval '6 hours'),
('Take the long way home','A city bicycle for coffee runs, sunny weekends, and taking the scenic route. Smooth ride, responsive brakes, and a timeless frame.

Recently checked over. Some cosmetic wear on the frame. A test ride is welcome at pickup.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','120','Sports & Outdoors','https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=85','Jordan','San Diego, CA','Good',true,'demo@example.com',now()-interval '7 hours'),
('Little pieces of everyday calm','A set of simple ceramic pieces, lovely for small arrangements, a shelf, or your favorite corner at home. Neutral tones and gently textured finishes.

No chips or cracks. Sold as a set. Carefully packed for local collection.

This is a sample listing used to demonstrate the marketplace. The item is not actually for sale.','28','Home & Living','https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85','Riley','Los Angeles, CA','Like new',true,'demo@example.com',now()-interval '8 hours') returning id,title;
