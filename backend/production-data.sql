--
-- PostgreSQL database dump
--

\restrict lhpeBvn0Ed7PxFLMKCPdfji0H6655atjfTDEiFTVWMEFV2ZhwNg8G8RnxQxVKUQ

-- Dumped from database version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: bases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bases (id, name, location) FROM stdin;
1	Fort Alpha	Chennai
2	Fort Bravo	Bangalore
\.


--
-- Data for Name: equipment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment_types (id, name, category) FROM stdin;
1	5.56mm Ammo	AMMUNITION
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, base_id, equipment_type_id, quantity) FROM stdin;
1	1	1	115
2	2	1	25
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, role, base_id) FROM stdin;
2	commander1	$2b$10$H27TdBRRx5mMJuW575M06OOjRo3MmFfQIhsUD38bf1QMhkZvJwXS2	BASE_COMMANDER	1
1	admin_user	$2b$10$w5pD0TQH7dcKGGYAGd0Y5eul7xzsz8TcrSX6bE3spH6He8zaDf.yO	ADMIN	\N
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, user_id, base_id, equipment_type_id, quantity, assigned_at) FROM stdin;
1	1	1	1	10	2026-08-11 22:57:04.363456
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, details, created_at) FROM stdin;
1	1	TRANSFER	Transferred 20 equipment(s) from base 1 to base 2	2026-08-11 22:36:44.669568
2	1	PURCHASE	Purchased 50 equipment(s) of type 1 for base 1	2026-08-11 22:50:22.431258
3	1	ASSIGNMENT	Assigned 10 equipment(s) of type 1 to user 1 at base 1	2026-08-11 22:57:04.363456
4	1	EXPENDITURE	Expended 5 equipment(s) of type 1 at base 1 for user 1	2026-08-11 23:02:51.717815
5	1	EXPENDITURE	Expended 5 equipment(s) of type 1 at base 1 for user 1	2026-08-12 01:47:34.195441
6	2	PURCHASE	Purchased 10 equipment(s) of type 1 for base 1	2026-08-12 02:19:12.720553
7	2	TRANSFER	Transferred 5 equipment(s) from base 1 to base 2	2026-08-12 02:21:02.718684
8	2	EXPENDITURE	Expended 5 equipment(s) of type 1 at base 2 for user 2	2026-08-12 11:37:15.174111
9	1	PURCHASE	Purchased 5 equipment(s) of type 1 for base 2	2026-08-12 12:23:15.410696
10	1	PURCHASE	Purchased 5 equipment(s) of type 1 for base 2	2026-08-12 12:23:42.992747
11	1	PURCHASE	Purchased 5 equipment(s) of type 1 for base 2	2026-08-12 12:24:29.406302
\.


--
-- Data for Name: expenditures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenditures (id, user_id, base_id, equipment_type_id, quantity, expended_at) FROM stdin;
1	1	1	1	5	2026-08-11 23:02:51.717815
2	1	1	1	5	2026-08-12 01:47:34.195441
3	2	2	1	5	2026-08-12 11:37:15.174111
\.


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.purchases (id, base_id, equipment_type_id, quantity, created_at) FROM stdin;
2	1	1	50	2026-08-11 22:50:22.431258
3	1	1	10	2026-08-12 02:19:12.720553
4	2	1	5	2026-08-12 12:23:15.410696
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfers (id, source_base_id, destination_base_id, equipment_type_id, quantity, status, "timestamp", initiated_by) FROM stdin;
1	1	2	1	20	COMPLETED	2026-08-11 22:36:44.669568	1
2	1	2	1	5	COMPLETED	2026-08-12 02:21:02.718684	2
\.


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 2, true);


--
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assignments_id_seq', 1, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 11, true);


--
-- Name: bases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bases_id_seq', 2, true);


--
-- Name: equipment_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.equipment_types_id_seq', 1, true);


--
-- Name: expenditures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.expenditures_id_seq', 3, true);


--
-- Name: purchases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.purchases_id_seq', 6, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfers_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict lhpeBvn0Ed7PxFLMKCPdfji0H6655atjfTDEiFTVWMEFV2ZhwNg8G8RnxQxVKUQ

