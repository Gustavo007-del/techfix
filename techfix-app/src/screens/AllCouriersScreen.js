// E:\study\techfix\techfix-app\src\screens\AllCouriersScreen.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import client, { API_ENDPOINTS } from '../api/client';

export default function AllCouriersScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [couriers, setCouriers] = useState([]);
    const [filter, setFilter] = useState('all'); // all, in_transit, received

    useEffect(() => {
        fetchCouriers();
    }, [filter]);

    const fetchCouriers = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const response = await client.get(`${API_ENDPOINTS.COURIER_LIST}${params}`);
            
            if (response.data.success) {
                setCouriers(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching couriers:', error);
            Alert.alert('Error', 'Failed to fetch couriers');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCouriers();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'in_transit':
                return COLORS.warning;
            case 'received':
                return COLORS.success;
            default:
                return COLORS.gray;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'in_transit':
                return 'local-shipping';
            case 'received':
                return 'check-circle';
            default:
                return 'info';
        }
    };

    const renderCourierItem = ({ item }) => (
        <TouchableOpacity
            style={styles.courierCard}
            onPress={() => navigation.navigate('CourierView', { courierId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.courierId}>{item.courier_id}</Text>
                    <Text style={styles.courierDate}>
                        {new Date(item.sent_time).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialIcons 
                        name={getStatusIcon(item.status)} 
                        size={16} 
                        color={COLORS.white} 
                    />
                    <Text style={styles.statusText}>
                        {item.status === 'in_transit' ? 'In Transit' : 'Received'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MaterialIcons name="person" size={16} color={COLORS.gray} />
                    <Text style={styles.infoText}>
                        {item.technicians_info?.map(t => t.first_name || t.username).join(', ')}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <MaterialIcons name="inventory" size={16} color={COLORS.gray} />
                    <Text style={styles.infoText}>
                        {item.items?.length || 0} items
                    </Text>
                </View>

                {item.total_amount && (
                    <View style={styles.infoRow}>
                        <MaterialIcons name="currency-rupee" size={16} color={COLORS.gray} />
                        <Text style={styles.infoText}>
                            ₹{parseFloat(item.total_amount).toFixed(2)}
                        </Text>
                    </View>
                )}
            </View>

            {item.notes && (
                <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText} numberOfLines={2}>
                        {item.notes}
                    </Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => navigation.navigate('CourierView', { courierId: item.id })}
                >
                    <Text style={styles.viewButtonText}>View Details</Text>
                    <MaterialIcons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Couriers</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'in_transit' && styles.filterTabActive]}
                    onPress={() => setFilter('in_transit')}
                >
                    <Text style={[styles.filterText, filter === 'in_transit' && styles.filterTextActive]}>
                        In Transit
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'received' && styles.filterTabActive]}
                    onPress={() => setFilter('received')}
                >
                    <Text style={[styles.filterText, filter === 'received' && styles.filterTextActive]}>
                        Received
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={couriers}
                    renderItem={renderCourierItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="inbox" size={64} color={COLORS.lightGray} />
                            <Text style={styles.emptyText}>No couriers found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        flex: 1,
        marginLeft: 12,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: COLORS.light,
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.gray,
    },
    filterTextActive: {
        color: COLORS.white,
    },
    listContent: {
        padding: 16,
    },
    courierCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    courierId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    courierDate: {
        fontSize: 11,
        color: COLORS.gray,
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.white,
    },
    cardBody: {
        marginBottom: 12,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.dark,
    },
    notesContainer: {
        backgroundColor: COLORS.light,
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    notesLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.gray,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 12,
        color: COLORS.dark,
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        paddingTop: 12,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.gray,
        marginTop: 16,
    },
});