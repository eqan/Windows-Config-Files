SELECT p.id,
       p.post_name,
       ( ( Acos(Sin(42.5185462 * Pi() / 180) * Sin(
                lat.meta_value * Pi() / 180) +
                  Cos(
                    42.5185462 * Pi() / 180) * Cos(
                  lat.meta_value * Pi() / 180) *
                  Cos(
                    (
                         -83.7595802 - lng.meta_value ) * Pi() / 180)) *
           180 / Pi
           ()
         ) * 60 * 1.1515 ) AS distance
FROM   wpbm_posts p, wpbm_postmeta lat, wpbm_postmeta lng
    WHERE lat.post_id = p.id
	AND lat.meta_key = 'martygeocoderlat'
	AND lng.post_id = p.id
	AND lng.meta_key = 'martygeocoderlng'
AND  p.post_status = 'publish'
HAVING distance < 1000
ORDER  BY distance ASC
LIMIT  0, 1

EXPLAIN SELECT p.id,
       p.post_name,
       ( ( Acos(Sin(42.5185462 * Pi() / 180) * Sin(
                latitude.meta_value * Pi() / 180) +
                  Cos(
                    42.5185462 * Pi() / 180) * Cos(
                  latitude.meta_value * Pi() / 180) *
                  Cos(
                    (
                         -83.7595802 - longitude.meta_value ) * Pi() / 180)) *
           180 / Pi
           ()
         ) * 60 * 1.1515 ) AS distance
FROM   wpbm_posts p
       LEFT JOIN wpbm_postmeta latitude
              ON latitude.post_id = p.id
                 AND latitude.meta_key = 'martygeocoderlat'
       LEFT JOIN wpbm_postmeta longitude
              ON longitude.post_id = p.id
                 AND longitude.meta_key = 'martygeocoderlng'
WHERE  p.post_status = 'publish'
HAVING distance < 1000
ORDER  BY distance ASC
LIMIT  0, 1

SELECT p.id,
       p.post_name,
       md.meta_value,
       ( ( Acos(Sin(42.5185462 * Pi() / 180) * Sin(
                lat.meta_value * Pi() / 180) +
                  Cos(
                    42.5185462 * Pi() / 180) * Cos(
                  lat.meta_value * Pi() / 180) *
                  Cos(
                    (
                         -83.7595802 - lng.meta_value ) * Pi() / 180)) *
           180 / Pi
           ()
         ) * 60 * 1.1515 ) AS distance
FROM   wpbm_posts p, wpbm_postmeta lat, wpbm_postmeta lng, wpbm_postmeta miles,wpbm_postmeta md
    WHERE lat.post_id = p.id
	AND lat.meta_key = 'martygeocoderlat'
	AND lng.post_id = p.id
	AND lng.meta_key = 'martygeocoderlng'
	AND miles.post_id = p.id
	AND miles.meta_key = 'upto_miles'
	AND md.post_id = p.id
	AND md.meta_key = 'website_url'
AND  p.post_status = 'publish'
HAVING distance < 1000
ORDER  BY distance ASC
LIMIT  0, 1

SELECT p.id,
       p.post_name,
       md.meta_value,
       ( ( Acos(Sin(42.5185462 * Pi() / 180) * Sin(
                lat.meta_value * Pi() / 180) +
                  Cos(
                    42.5185462 * Pi() / 180) * Cos(
                  lat.meta_value * Pi() / 180) *
                  Cos(
                    (
                         -83.7595802 - lng.meta_value ) * Pi() / 180)) *
           180 / Pi
           ()
         ) * 60 * 1.1515 ) AS distance
FROM   wpbm_posts p, wpbm_postmeta lat, wpbm_postmeta lng, wpbm_postmeta miles,wpbm_postmeta md
    WHERE lat.post_id = p.id
	AND lat.meta_key = 'martygeocoderlat'
	AND lng.post_id = p.id
	AND lng.meta_key = 'martygeocoderlng'
	AND miles.post_id = p.id
	AND miles.meta_key = 'upto_miles'
	AND md.post_id = p.id
	AND md.meta_key = 'website_url'
AND  p.post_status = 'publish'
HAVING distance < CAST(miles.meta_value AS INT)
ORDER  BY distance ASC
LIMIT  0, 1
