# Data Stores

## All assertions are assuming the following structure

```sql
--
-- PostgreSQL database dump
--

-- Dumped from database version 14.7 (Homebrew)
-- Dumped by pg_dump version 14.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

-- start with dropping tables
DROP TABLE IF EXISTS public.test_collection CASCADE;
DROP TABLE IF EXISTS public."user" CASCADE;
DROP SEQUENCE IF EXISTS public.test_collection_id_seq CASCADE;

--
-- Name: test_collection; Type: TABLE; Schema: public; Owner: taylorromero
--

CREATE TABLE public.test_collection (
    id integer NOT NULL,
    name character varying NOT NULL,
    count integer,
    "isPublic" boolean,
    number integer,
    names varchar(255)[],
    "uniqueField" character varying,
    "uniqueField2" character varying,
    "uniqueField3" character varying,
    "uniqueField4" character varying,
    "someField" character varying,
    "someField2" character varying,
    "someField3" character varying,
    "otherField" character varying,
    "otherField2" character varying,
    "someOtherField" character varying,
    "randomUniqueField" character varying,
    target jsonb,
    slug character varying,
    "aNonIndexedField" boolean,
    "undefinedField" character varying,
    "nullField" character varying
);


ALTER TABLE public.test_collection OWNER TO taylorromero;

--
-- Name: test_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: taylorromero
--

CREATE SEQUENCE public.test_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: test_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taylorromero
--

ALTER SEQUENCE public.test_collection_id_seq OWNED BY public.test_collection.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: taylorromero
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    name character varying NOT NULL,
    count integer,
    "isPublic" boolean,
    number integer,
    names varchar(255)[],
    "uniqueField" character varying,
    "uniqueField2" character varying,
    "uniqueField3" character varying,
    "uniqueField4" character varying,
    "someField" character varying,
    "someField2" character varying,
    "someField3" character varying,
    "otherField" character varying,
    "otherField2" character varying,
    "someOtherField" character varying,
    "randomUniqueField" character varying,
    target jsonb,
    slug character varying,
    "aNonIndexedField" boolean,
    "undefinedField" character varying,
    "nullField" character varying
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: taylorromero
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: taylorromero
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: test_collection id; Type: DEFAULT; Schema: public; Owner: taylorromero
--

ALTER TABLE ONLY public.test_collection ALTER COLUMN id SET DEFAULT nextval('public.test_collection_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: taylorromero
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: test_collection; Type: TABLE DATA; Schema: public; Owner: taylorromero
--

COPY public.test_collection (id, name, count, "isPublic", number, names, "uniqueField", "uniqueField2", "uniqueField3", "uniqueField4", "someField", "someField2", "someField3", "otherField", "otherField2", "someOtherField", "randomUniqueField", target, slug, "aNonIndexedField", "undefinedField", "nullField") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: taylorromero
--

COPY public."user" (id, name, count, "isPublic", number, names, "uniqueField", "uniqueField2", "uniqueField3", "uniqueField4", "someField", "someField2", "someField3", "otherField", "otherField2", "someOtherField", "randomUniqueField", target, slug, "aNonIndexedField", "undefinedField", "nullField") FROM stdin;
\.


--
-- Name: test_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taylorromero
--

SELECT pg_catalog.setval('public.test_collection_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: taylorromero
--

SELECT pg_catalog.setval('public.user_id_seq', 1, false);


--
-- Name: test_collection test_collection_pk; Type: CONSTRAINT; Schema: public; Owner: taylorromero
--

ALTER TABLE ONLY public.test_collection
    ADD CONSTRAINT test_collection_pk PRIMARY KEY (id);


--
-- Name: user user_pk; Type: CONSTRAINT; Schema: public; Owner: taylorromero
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pk PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

```