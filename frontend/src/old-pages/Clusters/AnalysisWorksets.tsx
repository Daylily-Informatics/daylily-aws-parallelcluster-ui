// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
// with the License. A copy of the License is located at
//
// http://aws.amazon.com/apache2.0/
//
// or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react'
import {useTranslation} from 'react-i18next'

import {GetAnalysisWorksets} from '../../model'
import {useState, getState} from '../../store'
import {clusterDefaultUser} from '../../util'

import {
  Button,
  Header,
  SpaceBetween,
  Table,
  TextFilter,
} from '@cloudscape-design/components'
import {useCollection} from '@cloudscape-design/collection-hooks'

import EmptyState from '../../components/EmptyState'
import {extendCollectionsOptions} from '../../shared/extendCollectionsOptions'
import {EC2Instance} from '../../types/clusters'

interface AnalysisWorkset {
  name: string
  unitsCount: number
}

export default function AnalysisWorksets() {
  const {t} = useTranslation()
  const clusterName = useState(['app', 'clusters', 'selected']) as string | null
  const cluster = useState(['clusters', 'index', clusterName])
  const headNode: EC2Instance | undefined = useState([
    'clusters',
    'index',
    clusterName,
    'headNode',
  ])
  const worksets: AnalysisWorkset[] =
    (useState([
      'clusters',
      'index',
      clusterName,
      'analysisWorksets',
    ]) as AnalysisWorkset[] | undefined) || []
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const selectedCluster = getState(['app', 'clusters', 'selected'])
    const currentHeadNode: EC2Instance | undefined = selectedCluster
      ? getState(['clusters', 'index', selectedCluster, 'headNode'])
      : undefined

    if (!selectedCluster || !currentHeadNode?.instanceId) {
      return
    }

    setLoading(true)
    try {
      await GetAnalysisWorksets(
        selectedCluster,
        currentHeadNode.instanceId,
        cluster && clusterDefaultUser(cluster),
      )
    } finally {
      setLoading(false)
    }
  }, [cluster])

  React.useEffect(() => {
    if (headNode?.instanceId && clusterName) {
      refresh()
    }
  }, [clusterName, headNode?.instanceId, refresh])

  const {
    items,
    actions,
    collectionProps,
    filterProps,
    filteredItemsCount,
  } = useCollection(
    worksets,
    extendCollectionsOptions({
      filtering: {
        empty: (
          <EmptyState
            title={t('cluster.analysisWorksets.filtering.empty.title')}
            subtitle={t('cluster.analysisWorksets.filtering.empty.subtitle')}
          />
        ),
        noMatch: (
          <EmptyState
            title={t('cluster.analysisWorksets.filtering.noMatch.title')}
            subtitle={t('cluster.analysisWorksets.filtering.noMatch.subtitle')}
            action={
              <Button onClick={() => actions.setFiltering('')}>
                {t('cluster.analysisWorksets.filtering.noMatch.clearFilter')}
              </Button>
            }
          />
        ),
      },
      sorting: {
        defaultState: {
          sortingColumn: {
            sortingField: 'name',
          },
        },
      },
    }),
  )

  const hasHeadNode = !!headNode?.instanceId

  return (
    <Table
      {...collectionProps}
      loading={loading}
      loadingText={t('cluster.analysisWorksets.loadingText')}
      header={
        <Header
          variant="h3"
          counter={`(${filteredItemsCount}/${worksets.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="s">
              <Button
                iconName="refresh"
                onClick={refresh}
                disabled={!hasHeadNode}
              >
                {t('cluster.analysisWorksets.actions.refresh')}
              </Button>
            </SpaceBetween>
          }
        >
          {t('cluster.analysisWorksets.title')}
        </Header>
      }
      columnDefinitions={[
        {
          id: 'name',
          header: t('cluster.analysisWorksets.columns.name'),
          cell: item => item.name,
        },
        {
          id: 'units',
          header: t('cluster.analysisWorksets.columns.units'),
          cell: item => item.unitsCount,
        },
      ]}
      items={items}
      trackBy="name"
      filter={
        <TextFilter
          {...filterProps}
          filteringAriaLabel={t(
            'cluster.analysisWorksets.filtering.ariaLabel',
          )}
          filteringPlaceholder={t(
            'cluster.analysisWorksets.filtering.placeholder',
          )}
          countText={t('cluster.analysisWorksets.filtering.countText', {
            count: filteredItemsCount,
          })}
          disabled={!hasHeadNode}
        />
      }
      empty={
        <EmptyState
          title={t('cluster.analysisWorksets.empty.title')}
          subtitle={t(
            hasHeadNode
              ? 'cluster.analysisWorksets.empty.subtitle'
              : 'cluster.analysisWorksets.empty.noHeadNodeSubtitle',
          )}
          action={
            hasHeadNode ? (
              <Button iconName="refresh" onClick={refresh}>
                {t('cluster.analysisWorksets.actions.refresh')}
              </Button>
            ) : undefined
          }
        />
      }
      pagination={undefined}
      wrapLines
      stickyHeader
      resizableColumns
      stripedRows
      selectionType={undefined}
    />
  )
}
