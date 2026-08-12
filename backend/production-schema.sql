--
-- PostgreSQL database dump
--

\restrict WDe3HgfJv3Nd550fhJpneNqH85E3pSx6byyHX29TeTXt9FhIDz67Mr6sK4DmIhx

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    base_id integer,
    equipment_type_id integer,
    quantity integer NOT NULL,
    CONSTRAINT assets_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    user_id integer,
    base_id integer,
    equipment_type_id integer,
    quantity integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT assignments_quantity_check CHECK ((quantity > 0))
);


--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    details text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: bases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bases (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(150) NOT NULL
);


--
-- Name: bases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bases_id_seq OWNED BY public.bases.id;


--
-- Name: equipment_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(50) NOT NULL
);


--
-- Name: equipment_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.equipment_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipment_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.equipment_types_id_seq OWNED BY public.equipment_types.id;


--
-- Name: expenditures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenditures (
    id integer NOT NULL,
    user_id integer,
    base_id integer,
    equipment_type_id integer,
    quantity integer NOT NULL,
    expended_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expenditures_quantity_check CHECK ((quantity > 0))
);


--
-- Name: expenditures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenditures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenditures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenditures_id_seq OWNED BY public.expenditures.id;


--
-- Name: purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchases (
    id integer NOT NULL,
    base_id integer,
    equipment_type_id integer,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT purchases_quantity_check CHECK ((quantity > 0))
);


--
-- Name: purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.purchases_id_seq OWNED BY public.purchases.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    source_base_id integer,
    destination_base_id integer,
    equipment_type_id integer,
    quantity integer NOT NULL,
    status character varying(20) DEFAULT 'COMPLETED'::character varying,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    initiated_by integer,
    CONSTRAINT transfers_quantity_check CHECK ((quantity > 0))
);


--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30),
    base_id integer,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'BASE_COMMANDER'::character varying, 'LOGISTICS_OFFICER'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: bases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bases ALTER COLUMN id SET DEFAULT nextval('public.bases_id_seq'::regclass);


--
-- Name: equipment_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_types ALTER COLUMN id SET DEFAULT nextval('public.equipment_types_id_seq'::regclass);


--
-- Name: expenditures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures ALTER COLUMN id SET DEFAULT nextval('public.expenditures_id_seq'::regclass);


--
-- Name: purchases id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases ALTER COLUMN id SET DEFAULT nextval('public.purchases_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bases bases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bases
    ADD CONSTRAINT bases_pkey PRIMARY KEY (id);


--
-- Name: equipment_types equipment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_types
    ADD CONSTRAINT equipment_types_pkey PRIMARY KEY (id);


--
-- Name: expenditures expenditures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_transfers_equipment_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transfers_equipment_type_id ON public.transfers USING btree (equipment_type_id);


--
-- Name: idx_users_base_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_base_id ON public.users USING btree (base_id);


--
-- Name: assets assets_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_base_id_fkey FOREIGN KEY (base_id) REFERENCES public.bases(id) ON DELETE CASCADE;


--
-- Name: assets assets_equipment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_base_id_fkey FOREIGN KEY (base_id) REFERENCES public.bases(id);


--
-- Name: assignments assignments_equipment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id);


--
-- Name: assignments assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenditures expenditures_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_base_id_fkey FOREIGN KEY (base_id) REFERENCES public.bases(id);


--
-- Name: expenditures expenditures_equipment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id);


--
-- Name: expenditures expenditures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenditures
    ADD CONSTRAINT expenditures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: purchases purchases_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_base_id_fkey FOREIGN KEY (base_id) REFERENCES public.bases(id);


--
-- Name: purchases purchases_equipment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id);


--
-- Name: transfers transfers_destination_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_destination_base_id_fkey FOREIGN KEY (destination_base_id) REFERENCES public.bases(id);


--
-- Name: transfers transfers_equipment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_equipment_type_id_fkey FOREIGN KEY (equipment_type_id) REFERENCES public.equipment_types(id);


--
-- Name: transfers transfers_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id);


--
-- Name: transfers transfers_source_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_source_base_id_fkey FOREIGN KEY (source_base_id) REFERENCES public.bases(id);


--
-- Name: users users_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_base_id_fkey FOREIGN KEY (base_id) REFERENCES public.bases(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict WDe3HgfJv3Nd550fhJpneNqH85E3pSx6byyHX29TeTXt9FhIDz67Mr6sK4DmIhx

