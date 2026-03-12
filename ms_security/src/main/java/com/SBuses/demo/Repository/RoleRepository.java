package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends MongoRepository<Role, String> {

    Optional<Role> findByName(String name);

    boolean existsByName(String name);
    String name(String name);
}