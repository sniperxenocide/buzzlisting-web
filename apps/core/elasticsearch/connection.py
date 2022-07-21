from elasticsearch_dsl.connections import connections
from conf.licensed import ELASTIC_HOST, ELASTIC_PORT


def create():
    return connections.create_connection(hosts=[str(ELASTIC_HOST) + ':' + str(ELASTIC_PORT)], timeout=20)
